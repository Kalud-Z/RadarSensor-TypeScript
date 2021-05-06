export const struct = (...keys) => ((...v) => keys.reduce((o, k, i) => { o[k] = v[i]; return o; }, {}));
let decoder = new TextDecoder("utf-8");
export function arraybuffer2string(buf) {
    let decoded_string = decoder.decode(new Uint8Array(buf));
    let str = decoded_string.split(String.fromCharCode(0));
    return str[0];
}
export const states_struct = struct('name', 'status');
export function status_clearall(status_array) {
    status_array.forEach(element => element.status = 0);
}
export function status_set(status_array, status_name) {
    status_array.find(e => e.name == status_name).status = 1;
}
export function status_clear(status_array, status_name) {
    status_array.find(e => e.name == status_name).status = 0;
}
export function status_isset(status_array, status_name) {
    if (status_array.find(e => e.name == status_name).status == 1)
        return true;
    else
        return false;
}
export function status_iscomplete(status_array) {
    let total_status = 0;
    status_array.forEach(element => total_status += element.status);
    if (total_status == status_array.length)
        return true;
    else
        return false;
}
export const ws_states = { 'WS_STATE_DISCONNECTED': 0, 'WS_STATE_CONNECTED': 1 };
Object.freeze(ws_states);
export let ws_state = ws_states.WS_STATE_DISCONNECTED;
export function set_ws_state(k) { ws_state = k; }
export let ws;
export function set_ws(k) { ws = k; }
export function new_ws(urlpath, protocol) {
    console.log('now creating a ws');
    return new WebSocket(urlpath, protocol);
}
