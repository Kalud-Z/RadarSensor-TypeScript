///////////////////////////////////////
// cmds
///////////////////////////////////////

// rc cmds

// @ts-nocheck
import { arraybuffer2string, status_clear, status_set, struct, ws, ws_state, ws_states } from './basics.js';
import { TYPE_HEADER_SIZE_BYTES } from './headers.js';
import {
  cfg_parameter_count, cfg_parameter_value, cfg_parameter_value_struct,
  cfg_parameters_states,
  init_parameters,
  RE_TOKEN_DELIMS, set_cfg_parameter_count,
  TOKEN_DELIMITER,
  update_parameters,
} from './config_params.js';
import {
  clear_data_invalid_marker,
  graphics_states,
  nodes_names,
  nodes_omodes,
  set_data_invalid_marker,
  set_nodes_names,
  set_nodes_omodes,
  update_graphics,
} from './graphics.js';
import {
  cfg_file_current,
  cfg_file_list,
  controls_states, ctl_nruns, display_mode_info, display_mode_list, display_node_index_list, init_controls, rc_states,
  set_cfg_file_current,
  set_cfg_file_list, set_rc_state, trigger_id,
  update_cfg_file_list, update_controls, update_display_mode_list, update_trigger,
} from './controls.js';

export const rc_cmds = {
  'CMD_RC_CFG_UNKNOWN':	  0,
  'CMD_RC_RUN_GO':			  1,
  'CMD_RC_RUN_TRIGGER':	  2,
  'CMD_RC_RUN_HALT':		  3,
  'CMD_RC_RUN_QUIT':		  4,
  'CMD_RC_RUN_STATUS':	  5,
  'CMD_RC_HW_UP':				  6,
  'CMD_RC_HW_FINISHED':	  7,
  'CMD_RC_HW_DOWN':			  8,
  'CMD_RC_DATA_VALID':	  9,
  'CMD_RC_DATA_INVALID':  10,
  'CMD_RC_CFG_COUNT':		  11,
  'CMD_RC_CFG_VALUE':		  12,
  'CMD_RC_CFG_LOAD':		  13,
  'CMD_RC_CFG_SAVE':		  14,
  'CMD_RC_CFG_FILES':		  15,
  'CMD_RC_NODES_NAMES':	  16,
  'CMD_RC_NODES_OMODES':  17,
  'CMD_RC_FFIN_ADD':		  18,
  'CMD_RC_FFOUT_ADD':		  19
};
Object.freeze(rc_cmds);

export const cmds_struct = struct(
  'rc_cmd',
  'cmd_long',
  'cmd_short',
  'response_needed'
);

export const cmds = [
  cmds_struct(rc_cmds.CMD_RC_UNKNOWN,		'', 					      '',		0), // TODO :  did you mean 'CMD_RC_CFG_UNKNOWN' ?
  cmds_struct(rc_cmds.CMD_RC_RUN_GO,			  'rc_run_go', 	      'rg',	1),
  cmds_struct(rc_cmds.CMD_RC_RUN_TRIGGER,	  'rc_run_trigger',	  'rt',	0),
  cmds_struct(rc_cmds.CMD_RC_RUN_HALT,		  'rc_run_halt', 		  'rh',	1),
  cmds_struct(rc_cmds.CMD_RC_RUN_QUIT,		  'rc_run_quit', 		  'rq',	1),
  cmds_struct(rc_cmds.CMD_RC_RUN_STATUS,	  'rc_run_status', 	  'rs',	0),
  cmds_struct(rc_cmds.CMD_RC_HW_UP,			    'rc_hw_up',			 	  'hu',	0),
  cmds_struct(rc_cmds.CMD_RC_HW_FINISHED,	  'rc_hw_finished',	  'hf',	0),
  cmds_struct(rc_cmds.CMD_RC_HW_DOWN,			  'rc_hw_down',		 	  'hd',	0),
  cmds_struct(rc_cmds.CMD_RC_DATA_VALID,	  'rc_data_valid',	  'dv',	0),
  cmds_struct(rc_cmds.CMD_RC_DATA_INVALID,  'rc_data_invalid',  'di',	0),
  cmds_struct(rc_cmds.CMD_RC_CFG_COUNT,		  'rc_cfg_count', 	  'cc',	0),
  cmds_struct(rc_cmds.CMD_RC_CFG_VALUE,		  'rc_cfg_value', 	  'cv',	0),
  cmds_struct(rc_cmds.CMD_RC_CFG_LOAD,		  'rc_cfg_load', 		  'cl',	0),
  cmds_struct(rc_cmds.CMD_RC_CFG_SAVE,		  'rc_cfg_save', 		  'cs',	0),
  cmds_struct(rc_cmds.CMD_RC_CFG_FILES,		  'rc_cfg_files', 	  'cf',	0),
  cmds_struct(rc_cmds.CMD_RC_NODES_NAMES,	  'rc_nodes_names',   'nn',	0),
  cmds_struct(rc_cmds.CMD_RC_NODES_OMODES,  'rc_nodes_omodes',  'no',	0),
  cmds_struct(rc_cmds.CMD_RC_FFIN_ADD,		  'rc_ffin_add', 		  'ia',	0),
  cmds_struct(rc_cmds.CMD_RC_FFOUT_ADD,		  'rc_ffout_add', 	  'oa',	0)
];


export var rc_cmd_sent = -1;


export function cmd_short2rc_cmd (cmd_short) {
  var rc_cmd = rc_cmds.CMD_RC_UNKNOWN;
  cmds.forEach(key => (key.cmd_short == cmd_short) && (rc_cmd = key.rc_cmd))
  return rc_cmd;
}


export function cmd_long2rc_cmd (cmd_long) {
  var rc_cmd = rc_cmds.CMD_RC_UNKNOWN;
  cmds.forEach(key => (key.cmd_long == cmd_long) && (rc_cmd = key.rc_cmd))
  return rc_cmd;
}


export function rc_cmd2cmd_short(rc_cmd) {
  var cmd_short = 'xx';
  cmds.forEach(key => (key.rc_cmd == rc_cmd) && (cmd_short = key.cmd_short))
  return cmd_short;
}


export function send_cmd(rc_cmd, ...args) {
  var sendstring = rc_cmd2cmd_short(rc_cmd) + TOKEN_DELIMITER + [...args].join(TOKEN_DELIMITER) + "\n";
  if (ws_state == ws_states.WS_STATE_CONNECTED) {
    // no unresponded cmds before sending a new one
    if (rc_cmd_sent == -1) {
      ws.send(sendstring);
      if (cmds[rc_cmd].response_needed) rc_cmd_sent = rc_cmd;
    } else {
      console.log("WARNING: Can't send command " + sendstring + ". Still waiting for response to command " + rc_cmd2cmd_short(rc_cmd_sent));
    }
  } else {
    console.log("ws send: Not connected - can't send \"" + sendstring + "\"");
  }
}


export function request_initial_config() {
  // cfg_parameters
  send_cmd(rc_cmds.CMD_RC_CFG_COUNT);
  send_cmd(rc_cmds.CMD_RC_CFG_VALUE);

  // control
  send_cmd(rc_cmds.CMD_RC_CFG_FILES);
  send_cmd(rc_cmds.CMD_RC_RUN_STATUS);

  // graphics
  send_cmd(rc_cmds.CMD_RC_NODES_NAMES);
  send_cmd(rc_cmds.CMD_RC_NODES_OMODES);
}


export function process_cmd (data_buffer) {
  // convert command string into array of strings
  var cmd_array = arraybuffer2string(data_buffer.slice(TYPE_HEADER_SIZE_BYTES)).split(RE_TOKEN_DELIMS);

  // remove empty last element if present
  if (cmd_array[cmd_array.length - 1] == "") cmd_array = cmd_array.slice(0, cmd_array.length - 1)

  // do we know this command?
  var rc_cmd = cmd_short2rc_cmd(cmd_array[0]);
  if (rc_cmd == rc_cmds.CMD_RC_UNKNOWN)
    rc_cmd = cmd_long2rc_cmd(cmd_array[0]);
  if (rc_cmd == rc_cmds.CMD_RC_CFG_UNKNOWN) {
    console.log("ERROR: Unknown command " + cmd_array[0]);
    return;
  }

  // console.log("ws receive: Command | " + cmd_array);

  // did we receive a response to a command we sent before?
  if (rc_cmd == rc_cmd_sent) rc_cmd_sent = -1;

  // process commands
  switch (rc_cmd) {
    case rc_cmds.CMD_RC_DATA_INVALID:
      set_data_invalid_marker();
      break;
    case rc_cmds.CMD_RC_CFG_COUNT:
      var count = parseInt(cmd_array[1]);

      // count must be an integer value
      if (isNaN(count)) return;

      // did the number of cfg parameters change unexpectedly?
      if ((cfg_parameter_count != 0) && (count != cfg_parameter_count)) {
        // reset cfg_parameters values, request new set of cfg parameters
        console.log("WARNING: Number of cfg parameters has changed");
        init_parameters();
        update_parameters();
        send_cmd(rc_cmds.CMD_RC_CFG_VALUE);
      }

      // cfg_parameter_count = count;
      set_cfg_parameter_count(count)

      // update parameters configuration state
      status_set(cfg_parameters_states, 'CFG_PARAMETERS_STATE_COUNT');
      break;

    case rc_cmds.CMD_RC_CFG_VALUE:
      var name = cmd_array[1];
      var value = cmd_array[2];
      var text = cmd_array[3];
      var type = cmd_array[4];
      var allowed_values = cmd_array.slice(5).join(TOKEN_DELIMITER);

      // did we receive all command arguments?
      if (cmd_array.length < 6) return;

      // the number of cfg_parameters needs to be set before the first cfg parameter can be set
      if (cfg_parameter_count == 0) {
        // reset cfg parameters values and
        // request number of configuration parameters + full set of cfg parameters first
        init_parameters();
        update_parameters();
        send_cmd(rc_cmds.CMD_RC_CFG_COUNT);
        send_cmd(rc_cmds.CMD_RC_CFG_VALUE);
        return;
      }

      // do we already know a cfg parameter with the same name?
      var index = cfg_parameter_value.findIndex(element => element.name == name);
      var cfg_parameter_value_new = cfg_parameter_value_struct(name, value, text, type, allowed_values);
      if (index >= 0) {
        // yes: overwrite existing cfg parameter
        cfg_parameter_value[index] = cfg_parameter_value_new;
      } else {
        // no: add cfg parameter to array of known cfg parameters
        cfg_parameter_value[cfg_parameter_value.length] = cfg_parameter_value_new;
      }

      // set of parameters complete?
      if (cfg_parameter_count == cfg_parameter_value.length) {
        // update parameters configuration state
        status_set(cfg_parameters_states, 'CFG_PARAMETERS_STATE_VALUES');
      }

      update_parameters();
      break;

    case rc_cmds.CMD_RC_CFG_FILES:
      var files = cmd_array.splice(1).sort();
      // cfg_file_list = files;
      set_cfg_file_list(files)

      if (files.length == 0) {
        alert("ERROR: No configurations files");
        status_clear(controls_states, 'CONTROLS_STATE_CFG_FILES');
      } else {
        status_set(controls_states, 'CONTROLS_STATE_CFG_FILES');
      }
      update_cfg_file_list();
      break;

    case rc_cmds.CMD_RC_CFG_LOAD:
      var cfg_file = cmd_array.splice(1, 1);
      if (cfg_file.length == 0) { alert("ERROR: Could not load configuration file")}
      // cfg_file_current = cfg_file;
      set_cfg_file_current(cfg_file)
      update_cfg_file_list();
      break;

    case rc_cmds.CMD_RC_CFG_SAVE:
      var cfg_file = cmd_array.splice(1, 1);
      if (cfg_file.length == 0) { alert("ERROR: Could not save configuration file") }
      else {
        // cfg_file_current = cfg_file;
        set_cfg_file_current(cfg_file)
        update_controls();
      }
      send_cmd(rc_cmds.CMD_RC_CFG_FILES); // request current list of cfg files
      break;

    case rc_cmds.CMD_RC_NODES_NAMES:
      var nodes_names_old = nodes_names;
      // nodes_names = cmd_array.splice(1);
      set_nodes_names(cmd_array.splice(1))

      if (nodes_names_old.toString() != nodes_names.toString()) {
        status_clear(graphics_states, 'GRAPHICS_STATE_NODES_NAMES');

        // update graphics configuration state
        if (nodes_names.length == 0) { alert("ERROR: Empty set of nodes names received"); return }
        else { status_set(graphics_states, 'GRAPHICS_STATE_NODES_NAMES') }
      }
      break;

    case rc_cmds.CMD_RC_NODES_OMODES:
      var nodes_omodes_old = nodes_omodes.slice(0);
      // nodes_omodes = cmd_array.splice(1);
      set_nodes_omodes(cmd_array.splice(1));

      if (nodes_omodes_old.toString() != nodes_omodes.toString()) {
        status_clear(graphics_states, 'GRAPHICS_STATE_NODES_OMODES');

        // did we reveice an empty set of nodes output modes?
        if (nodes_omodes.length == 0) {
          alert("ERROR: Empty set of nodes output modes received");
          status_clear(graphics_states, 'GRAPHICS_STATE_NODES_OMODES');
          return;
        }

        // do we already know the nodes names?
        if (nodes_names.length == 0) {
          // if not: request nodes names and nodes omodes
          send_cmd(rc_cmds.CMD_RC_NODES_NAMES);
          return;
        }

        // generate display mode list from nodes names and nodes output modes
        display_mode_list = [];  //TODO : it is though a VAR in some other file. is this gonna cause also a run-time error ?
        display_node_index_list = [];

        for (let i in display_mode_info) {
          // if display mode in nodes names
          if (nodes_names.includes(display_mode_info[i].node_name_required)) {
            let dni = nodes_names.findIndex(n => n == display_mode_info[i].node_name_required);
            if (nodes_omodes[dni] == 1) { // if node output enabled
              // store display mode and node index
              display_mode_list.push(display_mode_info[i].mode);
              display_node_index_list.push(dni);
            }
          }
        }

        // nothing found? -> Show a message
        // if (display_mode_list.length == 0) {
        // 	alert("WARNING: No suitable data received.\nCheck pipeline type and node output modes.");
        //
        // }

        // update display mode list
        update_display_mode_list();

        // update graphics configuration state
        status_set(graphics_states, 'GRAPHICS_STATE_NODES_OMODES');

        update_graphics();
      }
      break;

    case rc_cmds.CMD_RC_RUN_HALT:
      // rc_state = rc_states.RC_STATE_HALT;
      set_rc_state(rc_states.RC_STATE_HALT)
      status_set(controls_states, 'CONTROLS_STATE_STATUS');
      update_parameters();
      update_controls();
      break;

    case rc_cmds.CMD_RC_RUN_GO:
      // rc_state = rc_states.RC_STATE_GO;
      set_rc_state(rc_states.RC_STATE_GO)
      ctl_nruns = parseInt(cmd_array[1], 10); //TODO : not sure about this one.
      trigger_id = parseInt(cmd_array[2], 10);
      status_set(controls_states, 'CONTROLS_STATE_STATUS');
      clear_data_invalid_marker();
      update_trigger();
      update_parameters();
      update_controls();
      break;

    case rc_cmds.CMD_RC_RUN_QUIT:
      // rc_state = rc_states.RC_STATE_QUIT;
      set_rc_state(rc_states.RC_STATE_QUIT)

      let quit_return_value = cmd_array.splice(1, 1); // TODO: in legacy_code this var was not declared before. still the code worked !
      if (quit_return_value.length == 0) {
        quit_return_value[0] = '0';
      }
      clear_data_invalid_marker();
      init_parameters();
      init_controls();
      update_parameters();
      update_controls();
      alert("Radar control software has been terminated.\nExit status: " + quit_return_value[0]);
      break;

    default:
      break;
  }


}


