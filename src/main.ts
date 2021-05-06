// @ts-nocheck

import { new_ws, set_ws, set_ws_state, ws, ws_state, ws_states } from './basics.js';
import { process_cmd, request_initial_config } from './commands.js';
import {
  arraybuffer2type_header,
  HEADER_TAG_COMMAND,
  HEADER_TAG_DATA, HEADER_TAG_NODE,
  HEADER_TAG_PIPELINE,
  process_pipeline_headers,
  TYPE_HEADER_SIZE_BYTES,
} from './headers.js';
import { adjust_graphics, init_graphics, process_graphics_data, update_graphics } from './graphics.js';
import {
  cfg_file_load_handler,
  cfg_file_save_handler,
  display_mode_handler, init_controls,
  nruns_handler,
  quit_handler,
  run_stop_handler,
  trigger_handler, update_controls,
} from './controls.js';
import { init_parameters, update_parameters } from './config_params.js';



console.log('we are in main.js');

function init_window() {
  init_graphics();
  init_controls();
  init_parameters();
}


function update_window() {
  adjust_graphics();
  update_graphics();
  update_controls();
  update_parameters();
}


jQuery(document).ready(function($){

  // initialize settings
  init_window();
  update_window();

  // open websockets connection
  // ws = new_ws(get_appropriate_ws_url(""), "rc");
  // ws = new_ws('ws://192.168.1.101:4000/', "rc");
  set_ws(new_ws('ws://192.168.1.101:4000/', "rc"))

  ws.binaryType = 'arraybuffer';

  try {
    ws.onopen = function() {
      // ws_state = ws_states.WS_STATE_CONNECTED;
      set_ws_state(ws_states.WS_STATE_CONNECTED)
      console.log("ws open");
      request_initial_config();
    };

    ws.onmessage = function got_packet(msg) {
      // console.log('we just received data from websocket | msg.data : ', msg.data); //this is ALWAYS an ArrayBuffer
      var type_header = arraybuffer2type_header(msg.data.slice(0, TYPE_HEADER_SIZE_BYTES));
      switch (type_header.tag) {
        case HEADER_TAG_PIPELINE:
          console.log('we just got HEADER_TAG_PIPELINE');
          process_pipeline_headers(msg.data);
          break;
        case HEADER_TAG_DATA:
          console.log('we just got HEADER_TAG_DATA');
          process_graphics_data(msg.data);
          break;
        case HEADER_TAG_COMMAND:
          console.log('we just got HEADER_TAG_COMMAND');
          process_cmd(msg.data);
          break;
        case HEADER_TAG_NODE:
        default:
          console.log("ws receive: ERROR | Unexpected header received: " + type_header.tag);
          break;
      }
    };

    ws.onclose = function(){
      // ws_state = ws_states.WS_STATE_DISCONNECTED;
      set_ws_state(ws_states.WS_STATE_DISCONNECTED)

      console.log("ws close");
    };

  } catch(exception) { alert("<p>Error " + exception) }

  // register event handlers
  // window resize
  $(window).bind('resize', function() {
    if ($("input").is(":focus")) {
      // save id of input field focused during resize and restore focus after update
      // to keep virtual keyboard active on mobile devices
      var id = $(":focus").attr("id");
      update_window();
      $("#" + id).focus();
    } else {
      update_window();
    }
  });
  // Runs/RUN/STOP/QUIT
  $('#ctl_nruns').change(nruns_handler);
  $('#ctl_run').click(run_stop_handler);
  $('#ctl_quit').click(quit_handler);
  // Display mode
  $('#ctl_display_mode').change(display_mode_handler);
  // trigger source
  $('#ctl_trigger_source').change(trigger_handler);
  $('#ctl_trigger_id').change(trigger_handler);
  // cfg file load/save
  $('#ctl_cfg_file_load_name').change(cfg_file_load_handler);
  $('#ctl_cfg_file_save').click(cfg_file_save_handler);

});
