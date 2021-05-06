///////////////////////////////////////
// control elements
///////////////////////////////////////

// Trigger IDs

// @ts-nocheck

import { states_struct, status_clearall, struct } from './basics.js';
import { rc_cmd_sent, rc_cmds, send_cmd } from './commands.js';
import { update_canvas_overlays } from './graphics.js';
import { cfg_parameter_value } from './config_params.js';





export const trigger_id_timeout = 0;
export const trigger_id_internal = 1;
export const trigger_id_external_hw = 2;
export var trigger_id;

// rc state
export const rc_states = {
  'RC_STATE_UNDEFINED': 0,
  'RC_STATE_HALT':      1,
  'RC_STATE_GO':        2,
  'RC_STATE_QUIT':      3
};
Object.freeze(rc_states);

export var rc_state;
export function set_rc_state(state) {  rc_state = state }

export const controls_states = [
  states_struct('CONTROLS_STATE_CFG_FILES',	0),
  states_struct('CONTROLS_STATE_STATUS',		0)
];


// default number of runs
export var ctl_nruns_default = 0;


// cfg file list
export var cfg_file_current;
export function set_cfg_file_current(file) { cfg_file_current = file }


export var cfg_file_list;
export function set_cfg_file_list(list) { cfg_file_list = list }

// display modes
export const display_mode_info_struct = struct(
  'mode',
  'node_name_required',
  'match_to_pipeline'
);

// set required node names for display modes
// and matches between pipeline names and display modes
export var display_mode_info = [
  display_mode_info_struct('R/D Map',	'FFT2ABSLOG', 'RDMAP'),
  display_mode_info_struct('CFAR',	'CFAR'		, 'CFAR')
];

export var display_mode_combined = "Combined";

export var display_mode_list;
export var display_node_index_list;
export var display_mode;

export var node_index_required;

export function run_stop_handler() {
  $("#ctl_run").attr("disabled", "disabled");

  switch (rc_state) {
    case rc_states.RC_STATE_UNDEFINED:
      break;

    case rc_states.RC_STATE_QUIT:
      break;

    case rc_states.RC_STATE_HALT:
      send_cmd(rc_cmds.CMD_RC_RUN_GO, $('#ctl_nruns').val(), trigger_id);
      break;

    case rc_states.RC_STATE_GO:
      send_cmd(rc_cmds.CMD_RC_RUN_HALT);
      break;

    default:
      console.log("ERROR: Unknown rc state: " + rc_state);
      break;
  }
}

export function quit_handler() {
  send_cmd(rc_cmds.CMD_RC_RUN_QUIT);
  $("#ctl_quit").attr("disabled", "disabled");
}

export let ctl_nruns;

export function nruns_handler() {
  ctl_nruns = $('#ctl_nruns').val();
}

export function cfg_file_load_handler() {
  send_cmd(rc_cmds.CMD_RC_CFG_LOAD, $("#ctl_cfg_file_load_name").val());
  // clear cfg file name; name will be set in response
  $("#ctl_cfg_file_load_name").val("");
}

export function cfg_file_save_handler() {
  if ($('#ctl_cfg_file_save_name').val() != '') {
    // ignore path, use filename only
    var path_elements = $('#ctl_cfg_file_save_name').val().split(/[\\\/]+/);
    send_cmd(rc_cmds.CMD_RC_CFG_SAVE, path_elements[path_elements.length - 1]);
    $("#ctl_cfg_file_save_name").val(''); // clear cfg file name
  }
}

export function trigger_handler() {
  // default settings
  $('#parameter_input_timer_period_ms').attr('disabled', 'disabled');
  $('#ctl_trigger_id').attr('disabled', 'disabled');
  $('#ctl_trigger_id').attr('min', trigger_id_external_hw + 1);
  $('#ctl_trigger_id').val(trigger_id_external_hw + 1);

  switch ($('#ctl_trigger_source').val()) {
    case "Internal":
      trigger_id = trigger_id_internal;
      $('#parameter_input_timer_period_ms').removeAttr('disabled');
      break;

    case "External (HW)":
      trigger_id = trigger_id_external_hw;
      break;

    case "External (SW)":
      trigger_id = $('#ctl_trigger_id').val();
      $('#ctl_trigger_id').removeAttr('disabled');
      $('#ctl_trigger_id').attr('min', trigger_id_external_hw + 1);
      break;

    default: ;
  }
}

export function display_mode_handler() {
  display_mode = $("#ctl_display_mode").val();

  if (display_mode == display_mode_combined) {
    node_index_required = display_node_index_list[0]; // select first node in combined display mode
  } else {
    node_index_required = display_node_index_list[display_mode_list.findIndex(e => e == display_mode)]; // else pick suitable node index from node index list
  }

  update_canvas_overlays();
}


// update trigger controls
export function update_trigger() {
  $('#ctl_trigger_source').removeAttr('disabled');
  $('#ctl_trigger_id').attr('disabled', 'disabled');

  switch (trigger_id) {
    case trigger_id_timeout:
      alert("Error: Wrong trigger ID (" + trigger_id + ")");
      break;

    case trigger_id_internal:
      $('#ctl_trigger_source').val("Internal");
      break;

    case trigger_id_external_hw:
      $('#ctl_trigger_source').val("External (HW)");
      break;

    default:
      // external SW
      $('#ctl_trigger_source').val("External (SW)");
      $('#ctl_trigger_id').removeAttr('disabled');
      $('#ctl_trigger_id').val(trigger_id);
  }
}


// update config files list
export function update_cfg_file_list() {
  $("#ctl_cfg_file_load_name option").remove();  // remove old cfg files

  for (var index in cfg_file_list) {  // append cfg files to listbox
    $("#ctl_cfg_file_load_name").append("<option>" + cfg_file_list[index] + "</option>");
  }
  $("#ctl_cfg_file_load_name").val(cfg_file_current);  // set previously stored cfg file
}


// update display mode list
export function update_display_mode_list() {
  $("#ctl_display_mode option").remove();  // remove old display modes
  for (var index in display_mode_list) { // append display modes to listbox
    $("#ctl_display_mode").append("<option>" + display_mode_list[index] + "</option>");

    // select display mode if it fits the current pipeline
    if (cfg_parameter_value.find(n => n.name == "pipeline_type").current_value == display_mode_info.find(n => n.mode == display_mode_list[index]).match_to_pipeline) {
      $("#ctl_display_mode").val(display_mode_list[index]);
      display_mode = display_mode_list[index];
      node_index_required = display_node_index_list[index];
    }
  }

  // add "Combined" option, if more than one display mode available
  if (display_mode_list.length > 1) {
    $("#ctl_display_mode").append("<option>" + display_mode_combined + "</option>");
  }
}


export function update_controls() {
  switch (rc_state) {
    case rc_states.RC_STATE_UNDEFINED:

    case rc_states.RC_STATE_QUIT:
      $("#ctl_nruns").attr("disabled", "disabled");
      $("#ctl_run").attr("disabled", "disabled");
      $("#ctl_run").attr("value", "Start");;
      $("#ctl_cfg_file_load_name").attr("disabled", "disabled");
      $("#ctl_cfg_file_load").attr("disabled", "disabled");
      $("#ctl_cfg_file_save_name").attr("disabled", "disabled");
      $("#ctl_cfg_file_save").attr("disabled", "disabled");
      $('#ctl_trigger_source').attr('disabled', 'disabled');
      $('#ctl_trigger_id').attr('disabled', 'disabled');
      $('#ctl_display_mode').attr('disabled', 'disabled');
      break;

    case rc_states.RC_STATE_HALT:
      $("#ctl_nruns").removeAttr("disabled");
      $("#ctl_run").removeAttr("disabled");
      $("#ctl_run").attr("value", "Start");;
      $("#ctl_cfg_file_load_name").removeAttr("disabled");
      $("#ctl_cfg_file_load").removeAttr("disabled");
      $("#ctl_cfg_file_save_name").removeAttr("disabled");
      $("#ctl_cfg_file_save").removeAttr("disabled");
      $('#ctl_trigger_source').removeAttr('disabled');
      if ($('#ctl_trigger_source').val() == "External (SW)") {
        $('#ctl_trigger_id').removeAttr('disabled');
      }
      $('#ctl_display_mode').removeAttr('disabled');
      break;

    case rc_states.RC_STATE_GO:
      $("#ctl_nruns").attr("disabled", "disabled");
      $("#ctl_run").removeAttr("disabled");
      $("#ctl_run").attr("value", "Stop");
      $("#ctl_cfg_file_load_name").attr("disabled", "disabled");
      $("#ctl_cfg_file_load").attr("disabled", "disabled");
      $("#ctl_cfg_file_save_name").removeAttr("disabled");
      $("#ctl_cfg_file_save").removeAttr("disabled");
      $('#ctl_trigger_source').attr('disabled', 'disabled');
      $('#ctl_trigger_id').attr('disabled', 'disabled');
      $('#ctl_display_mode').removeAttr('disabled');
      break;

    default:
      console.log("ERROR: Unknown rc state: " + rc_state);
      break;
  }
}



export function init_controls() {
  cfg_file_current = '';
  cfg_file_list = [];
  $('#ctl_cfg_file_load_name').val(cfg_file_current);
  $('#ctl_nruns').val(ctl_nruns_default);
  rc_state = rc_states.RC_STATE_UNDEFINED;
  rc_cmd_sent = -1;

  trigger_id = trigger_id_internal;
  $('#ctl_trigger_source').val('Internal');
// 	$('#ctl_trigger_id').attr('disabled', 'disabled');
  $('#ctl_trigger_id').attr('min', trigger_id_external_hw + 1);
  $('#ctl_trigger_id').val(trigger_id_external_hw + 1);

  display_mode_list = [];
  display_node_index_list = [];
  display_mode = '';
  $('#ctl_display_mode').val(display_mode);
  node_index_required = -1;

  status_clearall(controls_states);
}



