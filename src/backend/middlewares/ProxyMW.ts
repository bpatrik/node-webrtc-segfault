import {NextFunction, Request, Response} from "express";
import {Logger} from "../Logger";
import {SignInRequestDTO} from "../../common/dto/SignInDTO";
import {UDPTest} from "../model/UDPTest";


const model = new UDPTest();

export class ProxyMWs {


  public static async udpTest(req: Request, res: Response, next: NextFunction) {
    try {
      const data: SignInRequestDTO = req.body;
      data.reliableDataConnection = (data.reliableDataConnection + "") == "true";
      res.json(await model.signIn(data));
    } catch (err) {
      Logger.error(err);
      return res.send("error");
    }
  }


}
