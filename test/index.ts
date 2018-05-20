import { Observable } from 'rxjs';
import { tap, filter } from 'rxjs/operators';
import { WebSocketClient } from '../dist';

const url = 'wss://echo.websocket.org';

let ws = new WebSocketClient();

ws.message$.pipe( 
    filter( ( msg: any ) => msg.type === 'utf8' ),
    tap( ( msg: any ) => {
        let data = JSON.parse( msg.utf8Data );
        console.log( data );
    } )
).subscribe();

console.log( 'Start...' );
ws.open( url ).then( () => {
    console.log( 'Connected.' );
    let i = 0;
    
    ws.send( 'first message' );
    let timer = setInterval( ()=>{
        if( i < 3 ){
            let data = { msg: 'test', count: i };
            ws.send( data );
            i++;
        } else {
            clearInterval( timer );
            ws.close().then( () => {
                console.log( 'Disconnected.' );
            } );
        }
    }, 2000 );
} );
