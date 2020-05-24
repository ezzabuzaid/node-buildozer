import { generatePhoneNumber, generateUsername, UserFixture, getUri } from '@test/fixture';
import { NetworkStatus, Constants } from '@core/helpers';
import * as faker from 'faker';
import { Roles } from '@shared/identity';
const USER_SESSION_ENDPOINT = getUri(`${ Constants.Endpoints.USERS }/${ Constants.Endpoints.SEARCH }`);

xdescribe('[INTERGRATION]', () => {

    describe('#CREATE USER', () => {

        let userFixture: UserFixture;

        beforeEach(() => {
            userFixture = new UserFixture();
        });

        describe('should fail if', () => {

            test('username exist before', async () => {
                const username = generateUsername();
                await userFixture.createUser({ username });
                const response = await userFixture.createUser({ username });
                expect(response.body.message).toMatch('username_entity_exist');
                expect(response.status).toBe(NetworkStatus.BAD_REQUEST);
            });

            test('email exist before', async () => {
                const email = faker.internet.email();
                await userFixture.createUser({ email });
                const response = await userFixture.createUser({ email });
                expect(response.body.message).toMatch('email_entity_exist');
                expect(response.status).toBe(NetworkStatus.BAD_REQUEST);
            });

            test('mobile exist before', async () => {
                const mobile = generatePhoneNumber();
                await userFixture.createUser({ mobile });
                const response = await userFixture.createUser({ mobile });
                expect(response.body.message).toMatch('mobile_entity_exist');
                expect(response.status).toBe(NetworkStatus.BAD_REQUEST);
            });

            test('username contains special char', async () => {
                const response = await userFixture.createUser({ username: 'testCreate2#$' });
                expect(response.body.message).toContain('wrong_username');
                expect(response.status).toBe(NetworkStatus.BAD_REQUEST);
            });

            test('mobile number is wrong', async () => {
                const response = await userFixture.createUser({ mobile: '0792807794' });
                expect(response.body.message).toContain('wrong_mobile');
                expect(response.status).toBe(NetworkStatus.BAD_REQUEST);
            });
            test('role is not one of supported roles', async () => {
                const response = await userFixture.createUser({ role: 'fakeRole' });
                expect(response.status).toBe(NetworkStatus.BAD_REQUEST);
            });
            test('email has no suffix', async () => {
                const response = await userFixture.createUser({ email: 'test@test' });
                expect(response.body.message).toContain('wrong_email');
                expect(response.status).toBe(NetworkStatus.BAD_REQUEST);
            });
            test('email has no @', async () => {
                const response = await userFixture.createUser({ email: 'testtest.com' });
                expect(response.body.message).toContain('wrong_email');
                expect(response.status).toBe(NetworkStatus.BAD_REQUEST);
            });
        });

        describe('should pass if', () => {
            test('mobile number is correct', async () => {
                const response = await userFixture.createUser({ mobile: '+962792807794' });
                expect(response.status).toBe(NetworkStatus.CREATED);
            });
            test('the role is one of supported roles', async () => {
                const response = await userFixture.createUser({ role: Roles.ADMIN });
                expect(response.status).toBe(NetworkStatus.CREATED);
            });
            test('the email has correct format', async () => {
                const response = await userFixture.createUser({ email: 'ezzabuzaid@hotmail.com' });
                expect(response.status).toBe(NetworkStatus.CREATED);
            });
            test('username has no special char', async () => {
                const response = await userFixture.createUser({ username: 'testname' });
                expect(response.status).toBe(NetworkStatus.CREATED);
            });
            test('username has uppercase char', async () => {
                const response = await userFixture.createUser({ username: 'upperCASETestName' });
                expect(response.status).toBe(NetworkStatus.CREATED);
            });
            test('username has dots', async () => {
                const response = await userFixture.createUser({ username: 'test.name' });
                expect(response.status).toBe(NetworkStatus.CREATED);
            });
            test('username has underscore', async () => {
                const response = await userFixture.createUser({ username: 'test_name' });
                expect(response.status).toBe(NetworkStatus.CREATED);
            });
        });

        // test('should be unverified by default', async () => {
        // const { body: { data: { id } } } = await userFixture.createUser({ verified: null });
        // const { headers } = await prepareUserSession();
        // const response = await superAgent
        //     .get(`${ getUri(Constants.Endpoints.USERS) }/${ id }`)
        //     .set(headers);
        // expect(response.body.data.verified).toEqual(false);
        // });

        test.todo('user should have a defualt profile equal to empty {}');
    });

    describe('#SEARCH FOR USES', () => {
        // test.skip('should return list of users depends on the provided name', () => {
        //     superAgent.get(USER_SESSION_ENDPOINT);
        // });
    });

});
