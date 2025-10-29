declare module "openid-client/passport" {
  import type { Strategy as PassportStrategy } from "passport";
  import type { VerifyFunction } from "openid-client";

  export class Strategy extends PassportStrategy {
    constructor(options: any, verify: VerifyFunction);
  }

  export type { VerifyFunction };
}
