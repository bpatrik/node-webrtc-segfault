import {TaskScheduler} from "../common/TaskScheduler";

export class Logger {

  private static errorTask = new TaskScheduler();

  constructor() {
  }


  public e(message: string, details?: any) {
    let stackTrace = (new Error()).stack.split("\n");

    let data = {
      message: message,
      stackTrace: stackTrace
    };

    if (typeof details !== 'undefined') {
      data['details'] = details;
    }


    let text = Logger.getPrettyTimeTag();
    if (details) {
      console.error(text, message, details);
    } else {
      console.error(text, message);
    }


  }

  public w(...args: any[]) {

    let text = Logger.getPrettyTimeTag();
    args.unshift(text);
    console.warn.apply(this, Array.prototype.slice.call(args));
  }

  public i(...args: any[]) {


    let text = Logger.getPrettyTimeTag();
    args.unshift("");
    args.unshift("color: green;");
    args.unshift("%c" + text + "%c");


    console.info.apply(this, Array.prototype.slice.call(args));
  }

  public d(...args: any[]) {

    let text = Logger.getPrettyTimeTag();
    args.unshift("color:black;");
    args.unshift("color: blue;");
    args.unshift("%c" + text + "%c");


    console.log.apply(this, Array.prototype.slice.call(args));
  }

  public v(...args: any[]) {

    let text = Logger.getPrettyTimeTag();
    args.unshift(text);
    console.debug.apply(this, Array.prototype.slice.call(args));
  }


  private static getPrettyTimeTag() {
    return "[" + (new Date()).toLocaleTimeString('en-US', {
      hour12: false,
      hour: "numeric",
      minute: "numeric",
      second: "numeric"
    }) + "]";
  }

}

export const Log = new Logger();

