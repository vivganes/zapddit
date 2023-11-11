import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BtcConnectService {

  constructor() {
    console.log("Adding btc-connect/disconnect listener...")
    window.addEventListener('bc:connected', () => {
        console.log("btc CONNECT")
        window.addEventListener('bc:disconnected', () => {
          console.log("btc DISCONNECT")
          window.location.reload();
        })
    })
  }

}
