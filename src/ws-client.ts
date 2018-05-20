import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { filter, flatMap, share, map } from 'rxjs/operators';
import { client, connection, IMessage } from 'websocket';
import { WsConnection } from './ws-connection';

export class WebSocketClient {
    private ws: client;
    private con: WsConnection = null;
    private connection$: BehaviorSubject<WsConnection> = new BehaviorSubject( null );
    private msg$: Observable<IMessage>;
    private utf8Data$: Observable<any>;

    constructor() {
        this.ws = new client();
        
        this.msg$ = this.connection$.pipe(
            filter( con => !!con ),
            flatMap( con => con.message$ ),
            share()
        );
        
        this.utf8Data$ = this.msg$.pipe(
            filter( msg => msg[ 'type' ] === 'utf8' ),
            map( msg => JSON.parse( msg[ 'utf8Data' ] ) ),
            share() );
    }
    
    private updateConnection( con: WsConnection ): void {
        // console.log( 'Websocket: update connection.' );
        this.con = con;
        this.connection$.next( this.con );
    }
    
    open( url: string ): Promise<void> {
        return new Promise<void>( ( resolve, reject ) => {
            // guard
            if( this.con ) {
                reject( new Error('Already opened.') );
            }

            // add listeners
            this.ws.once( 'connect', ( con: connection ) => {
                // console.log( 'Websocket: opened.' );
                this.updateConnection( new WsConnection( con ) );
                resolve();
            } );
            
            this.ws.once( 'connectFailed', ( err ) => {
             // console.log( 'Websocket: failed.', err );
                reject( new Error( err ) );
            } );
            
            this.ws.once( 'close', () => {
                // console.log( 'Websocket: closed.' );
                this.updateConnection( null );
            } );

            this.ws.connect( url );
        } );
    }
    
    close(): Promise<void> {
        if( !this.con || !this.con.opened ) {
            throw new Error( 'Cannot close.' );
        }
        
        return this.con.destroy().then( () => {
            this.updateConnection( null );
            return Promise.resolve();
        } );
    }
    
    send( data: any ): void {
        if( !this.con ) {
            throw new Error( 'Not connected' );
        }
        this.con.send( data );
    }
    
    get message$(): Observable<IMessage> {
        return this.msg$;
    }
    
    get json$(): Observable<any> {
        return this.utf8Data$;
    }
}
