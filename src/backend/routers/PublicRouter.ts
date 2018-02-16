import * as _express from "express";
import * as _path from "path";

export class PublicRouter {

  public static route(app) {


    //app.use(_express.static(_path.join(__dirname,"../../frontend"), {maxAge: 31536000}));
    app.use('/node_modules', _express.static(_path.join(__dirname,"../../../node_modules")));
    app.use('/', _express.static(_path.join(__dirname,"../../frontend")));
    app.use('/common', _express.static(_path.join(__dirname,"../../common")));


  }




}
