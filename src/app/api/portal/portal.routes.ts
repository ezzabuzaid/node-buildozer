import { Responses, SuccessResponse } from '@core/response';
import { AppUtils, cast } from '@core/utils';
import { locate } from '@lib/locator';
import { PrimaryKey } from '@lib/mongoose';
import { FromBody, HttpGet, HttpPost, Route, FromQuery, ContextResponse } from '@lib/restful';
import { FromHeaders } from '@lib/restful/headers.decorator';
import { validate } from '@lib/validation';
import { PasswordValidator, PrimaryIDValidator, TokenValidator, ValidationPatterns } from '@shared/common';
import { EmailService } from '@shared/email';
import { identity, IRefreshTokenClaim, tokenService } from '@shared/identity';
import { IsEmail, IsIn, IsJWT, IsMongoId, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { TokenExpiredError } from 'jsonwebtoken';
import { scheduleJob } from 'node-schedule';
import { PortalHelper } from './portal.helper';
import { SessionsService } from '@api/sessions';
import { UserService } from '@api/users';
import { Constants } from '@core/constants';
import { HashHelper } from '@core/helpers';
import { Response } from 'express';

class Pincode {
    public ttl = AppUtils.duration(5);
    constructor(
        public pincode: string
    ) { }

    expired() {
        return AppUtils.isDateElapsed(this.ttl);
    }

    notEqual(pincode: string) {
        return !this.equal(pincode);
    }

    equal(pincode: string) {
        return this.pincode === pincode;
    }
}

/**
 * a Map consist of key-value pair of user id and pincode
 */
const pincodes = new Map<PrimaryKey, Pincode>();

export class SendPincodeValidator {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    mobile: string = null;

    @IsEmail()
    @IsOptional()
    email: string = null;

    @IsMongoId() id: PrimaryKey = null;

    @IsString()
    @IsNotEmpty()
    @IsIn(['email', 'sms'])
    type: 'email' | 'sms' = null;
}

export class CheckPincodeValidator extends PrimaryIDValidator {
    @IsNotEmpty()
    @IsString()
    pincode: string = null;
}

export class AccountVerificationDto {
    @IsNotEmpty()
    @IsString()
    username: string = null;
    @IsNotEmpty()
    @IsString()
    firstName: string = null;
    @IsNotEmpty()
    @IsString()
    lastName: string = null;
    @IsNotEmpty()
    @IsString()
    placeOfBirth: string = null;
}

export class CredentialsDto {
    @IsString()
    @IsNotEmpty()
    public username: string = null;
    @IsString()
    @IsNotEmpty()
    public password: string = null;
}

export class RefreshTokenDto {
    @IsString()
    @IsJWT()
    public token: string = null;
    @IsString()
    @IsJWT()
    public refreshToken: string = null;
}
export class DeviceUUIDHeaderValidator {
    @IsString()
    public [Constants.Application.deviceIdHeader] = null;
}
class ResetPasswordDto extends PrimaryIDValidator {
    @Matches(ValidationPatterns.Password, { message: 'wrong_password' })
    password: string = null;
    @IsNotEmpty()
    @IsString()
    pincode: string = null;
}
export class RefreshToken {
    public token: string;
    public refreshToken: string;
    constructor(user_id: PrimaryKey, role: string, verified: boolean, name: string) {
        const portalHelper = locate(PortalHelper);
        this.token = portalHelper.generateToken(user_id, role, verified, name);
        this.refreshToken = portalHelper.generateRefreshToken(user_id);
    }
}

@Route(Constants.Endpoints.PORTAL)
export class PortalRouter {
    static MAX_SESSION_SIZE = 1000;
    private sessionsService = locate(SessionsService);
    private usersService = locate(UserService);

    constructor() { }

    @HttpPost(Constants.Endpoints.LOGIN)
    public async login(
        @FromBody(CredentialsDto) credentials: CredentialsDto,
        @FromHeaders(Constants.Application.deviceIdHeader) device_uuid: string
    ) {
        // TODO: Send Email only if push notification not applicable
        const { data: user } = await this.usersService.one({ username: credentials.username }, {
            projection: {
                password: 1,
                role: 1,
                email: 1,
                username: 1
            }
        });

        const isPasswordEqual = HashHelper.comparePassword(credentials.password, user.password);
        if (AppUtils.isFalsy(isPasswordEqual)) {
            return new Responses.BadRequest('wrong_credintals');
        }
        const activeUserSessions = await this.sessionsService.getActiveUserSession(user.id);
        if (activeUserSessions.data.length >= PortalRouter.MAX_SESSION_SIZE) {
            EmailService.sendEmail({
                from: 'admin@admin.com',
                to: user.email,
                text: `Your have exceeded your login attempts, please contact with the support for more information`
            });
            return new Responses.BadRequest('exceeded_allowed_sesison');
        }
        await this.sessionsService.create({
            device_uuid,
            active: true,
            user: user.id
        });
        EmailService.sendEmail({
            text: `New login at ${ new Date() }`,
            from: 'admin@admin.com',
            to: user.email,
        });
        return new Responses.Ok(new RefreshToken(user.id, user.role, user.emailVerified, user.username));
    }

    @HttpPost(Constants.Endpoints.LOGOUT)
    public async logout(@FromHeaders(Constants.Application.deviceIdHeader) device_uuid: string) {
        const result = await this.sessionsService.deActivate({ device_uuid });
        return new Responses.Ok(result.data);
    }

    @HttpPost(Constants.Endpoints.REFRESH_TOKEN)
    public async refreshToken(
        @FromBody(RefreshTokenDto) body: RefreshTokenDto,
        @FromHeaders(Constants.Application.deviceIdHeader) device_uuid: string
    ) {
        const { token, refreshToken } = body;
        try {
            const decodedRefreshToken = await tokenService.decodeToken<IRefreshTokenClaim>(refreshToken);
            try {
                await tokenService.decodeToken(token);
            } catch (error) {
                if (error instanceof TokenExpiredError) {
                    const session = await this.sessionsService.getActiveSession({
                        device_uuid,
                        user: decodedRefreshToken.id
                    });

                    const { data: user } = await this.usersService.one({ _id: decodedRefreshToken.id });

                    await this.sessionsService.updateById(session.data.id, { updatedAt: new Date().toISOString() });
                    return new Responses.Ok(new RefreshToken(user.id, user.role, user.emailVerified, user.username));
                }
            }
        } catch (error) {
            await this.sessionsService.deActivate({ device_uuid });
        }
        return new Responses.BadRequest();
    }

    @HttpPost(
        Constants.Endpoints.ACCOUNT_VERIFIED,
        validate(AccountVerificationDto, 'body', 'Please make sure you have entered the correct information payload.')
    )
    public async accountVerifed(@FromBody(AccountVerificationDto) account: AccountVerificationDto) {
        try {
            const result = await this.usersService.one({
                'username': account.username,
                'profile.firstName': account.firstName,
                'profile.lastName': account.lastName,
                'profile.placeOfBirth': account.placeOfBirth,
            });
            const { emailVerified, mobileVerified, id } = result.data;
            if (emailVerified) {
                return new Responses.Ok({ emailVerified, mobileVerified, id });
            } else {
                return new Responses.BadRequest('You cannot reset you password because your account it not verified yet, please contact the adminstration for further actions');
            }
        } catch (error) {
            return new Responses.BadRequest('Please make sure you have entered the correct information.');
        }
    }

    @HttpPost(Constants.Endpoints.SEND_PINCODE)
    public async sendPincode(@FromBody(SendPincodeValidator) body: SendPincodeValidator) {
        const { email, mobile, type, id } = body;
        const pincode = locate(PortalHelper).generatePinCode();
        if (type === 'email') {
            const result = await this.usersService.one({ email, _id: id });
            if (AppUtils.not(result.hasError)) {
                EmailService.sendPincodeEmail(email, pincode);
            }
        } else {
            const result = await this.usersService.one({ mobile, _id: id });
            if (AppUtils.not(result.hasError)) {
                // Send sms
            }
        }
        pincodes.set(id, new Pincode(pincode));
        return new SuccessResponse(`${ type === 'email' ? 'An e-mail' : 'A SMS ' } message sent to your mobile with additional information`);
        // No error handling if the user is not exist
    }

    @HttpPost(Constants.Endpoints.CHECK_PINCODE, validate(CheckPincodeValidator))
    public async checkPincode(@FromBody(CheckPincodeValidator) payload: CheckPincodeValidator) {
        const expectedPincode = pincodes.get(payload.id);
        if (expectedPincode.expired()) {
            return new Responses.BadRequest('Pincode is not valid anymore, please try again later');
        } else if (expectedPincode.notEqual(payload.pincode)) {
            return new Responses.BadRequest('Wrong pincode, please try again');
        }
        return new Responses.Ok(null);
    }

    @HttpPost(
        Constants.Endpoints.RESET_PASSWORD,
        validate(PasswordValidator),
        validate(CheckPincodeValidator),
    )
    public async resetPassword(@FromBody(ResetPasswordDto) payload: ResetPasswordDto, @ContextResponse() response) {
        const expectedPincode = pincodes.get(payload.id);
        if (expectedPincode.expired()) {
            return new Responses.BadRequest('Pincode is not valid anymore, please try again later');
        } else if (expectedPincode.notEqual(payload.pincode)) {
            // if the pincode was wrong so he in wrong place so we need to redirect him away
            response.redirect('http://localhost:4200/portal/login');
        }
        pincodes.delete(payload.id);
        const result = await this.usersService.updateById(payload.id, { password: payload.password });
        if (result.hasError) {
            return new Responses.BadRequest('Please try again later');
        }
        await EmailService.sendResetPasswordEmail('user@email.com');
        return new Responses.Ok(null);
    }

    @HttpGet(Constants.Endpoints.VERIFY_EMAIL)
    public async updateUserEmailVerification(
        @FromQuery(TokenValidator) { token }: TokenValidator,
        @ContextResponse() response: Response
    ) {
        const decodedToken = await tokenService.decodeToken(token);
        const result = await this.usersService.updateById(decodedToken.id, { emailVerified: true });
        if (result.hasError) {
            return new Responses.BadRequest('Please try again later');
        }
        response.redirect('http://localhost:4200/');
    }

    @HttpGet(Constants.Endpoints.SEND_VERIFICATION_EMAIL, identity.Authorize())
    public async sendVerificationEmail(@FromHeaders('authorization') authorization: string) {
        const decodedToken = await tokenService.decodeToken(authorization);
        try {
            const result = await this.usersService.one({ _id: decodedToken.id });
            EmailService.sendVerificationEmail(result.data.email, result.data.id);
            return new Responses.Ok('Email has been sent successfully');
        } catch (error) {
            return new Responses.BadRequest('Please try again later');
        }
    }

}

// TODO remove expired pincodes
scheduleJob('30 * * * *', async () => {
    const sessions = await locate(SessionsService).getAllActiveSession();
    sessions.data.list.forEach((session) => {
        // if the active session updatedAt is late by 12 that's means that this session is no
        // longer used and should be turned of
        // TODO deActivate useless sessions
    });
});

// TODO: Forget and reset password scenario
// Lock the account after 3 times of trying
// Only previous registerd devices can be used to do forgot password;

// TODO already used refresh token shouldn't be used again
