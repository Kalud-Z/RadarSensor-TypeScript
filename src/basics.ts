///////////////////////////////////////
// basic objects and functions
///////////////////////////////////////


// @ts-nocheck


// constructor for structs
export const struct = (...keys) => ((...v) => keys.reduce((o, k, i) => {o[k] = v[i]; return o} , {})) ; //it is used outside


// convert array buffer to string and strip off trailing 0's
let decoder = new TextDecoder("utf-8");

export function arraybuffer2string(buf) { //it is used outside
  let decoded_string = decoder.decode(new Uint8Array(buf));
  // remove trailing 0-bytes
  let str = decoded_string.split(String.fromCharCode(0));
  return str[0];
}


// status handling | //it is used outside
export const states_struct = struct('name', 'status');

export function status_clearall(status_array) {
  status_array.forEach(element => element.status = 0);
}


export function status_set(status_array, status_name) {
// 	status_array[status_array.findIndex(element => element.name == status_name)].status = 1;
  status_array.find(e => e.name == status_name).status = 1;
}


export function status_clear(status_array, status_name) {
// 	status_array[status_array.findIndex(element => element.name == status_name)].status = 0;
  status_array.find(e => e.name == status_name).status = 0;
}


export function status_isset(status_array, status_name) {
// 	if (status_array[status_array.findIndex(element => element.name == status_name)].status == 1) return true;
// 	else return false;
  if (status_array.find(e => e.name == status_name).status == 1) return true;
  else return false;
}


export function status_iscomplete(status_array) {
  let total_status = 0;
  status_array.forEach(element => total_status += element.status);
  if (total_status == status_array.length) return true;
  else return false;
}




// websockets handling
// ws state
export const ws_states = { 'WS_STATE_DISCONNECTED': 0, 'WS_STATE_CONNECTED': 1 }; //it is used outside
Object.freeze(ws_states);

export let ws_state = ws_states.WS_STATE_DISCONNECTED; //it is used outside
export function set_ws_state(k) { ws_state = k }

// ws object
export let  ws;  //it is used outside
export function set_ws(k) { ws = k }

// return appropriate websockets URL
// export function get_appropriate_ws_url(extra_url) //use this function when frontend code is hosted on the board.
// {
//   let pcol;
//   let u = document.URL;
//
//   /*
//    * We open the websocket encrypted if this page came on an
//    * https:// url itself, otherwise unencrypted
//    */
//
//   if (u.substring(0, 5) === "https") {
//     pcol = "wss://";
//     u = u.substr(8);
//   } else {
//     pcol = "ws://";
//     if (u.substring(0, 4) === "http")
//       u = u.substr(7);
//   }
//
//   u = u.split("/");
//
//   /* + "/xxx" bit is for IE10 workaround */
//
//   return pcol + u[0] + "/" + extra_url;
// }


// open websocket
export function new_ws(urlpath, protocol)  {
  console.log('now creating a ws');
  return new WebSocket(urlpath, protocol);
}



