import { Singelton } from '@lib/locator';
import { Route, HttpPost, FromBody } from '@lib/restful';
import webpush from 'web-push';

@Singelton()
@Route('notifications')
export class NotificationController {

    @HttpPost('subscribe')
    async subscribe(@FromBody() subscription) {
        await webpush.sendNotification(subscription, { title: 'registerd' });
        return 'registerd';
    }

}