import {ProxyMWs} from "../middlewares/ProxyMW";


export class ProxyRouter {
    public static route(app: any) {
        this.addUDPTest(app);
    }


    private static addUDPTest(app) {
        app.post(["/api/udp-test/sign-in"],
            ProxyMWs.udpTest
        );
    };


}
