/** Authentication metadata for a hosted or standalone relay room. */
export type RoomAuthentication = {
    /** The authentication type. Currently only 'project' is supported. */
    type: string;
    /** The project id when authentication.type is 'project'. */
    id: number | string;
};

/** Client messages understood by the relay backend. */
export type RelayRequest =
    | 'ping'
    | { t: 'room:join'; name: string; authentication: RoomAuthentication }
    | { t: 'room:leave'; name: string }
    | { t: 'room:msg'; name: string; msg: unknown; to?: number };

/** Server messages consumed by the shared relay client. */
export type RelayResponse =
    | { t: 'welcome'; userId: number }
    | { t: 'room:join'; name: string; userId: number; users?: number[] }
    | { t: 'room:leave'; name: string; userId: number }
    | { t: 'room:msg' | 'room:dm'; name: string; msg: unknown; from: number }
    | { t?: never; error: string };
