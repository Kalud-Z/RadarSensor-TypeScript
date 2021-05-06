import { states_struct, status_clearall, struct } from './basics.js';
import { rc_state, rc_states, set_cfg_file_current } from './controls.js';
import { rc_cmds, send_cmd } from './commands.js';
export const RE_TOKEN_DELIMS = /[;\n]+/;
export const TOKEN_DELIMITER = ";";
export const NO_LIMIT = 'U';
export const FLOAT_FRACTION_DIGITS = 3;
export const cfg_parameters_states = [
    states_struct('CFG_PARAMETERS_STATE_COUNT', 0),
    states_struct('CFG_PARAMETERS_STATE_VALUES', 0),
];
export const cfg_parameter_value_struct = struct('name', 'current_value', 'text', 'type', 'allowed_values');
export let cfg_parameter_value = [];
export let cfg_parameter_count = 0;
export function set_cfg_parameter_count(num) { cfg_parameter_count = num; }
export function check_parameter(parameter) {
    let i = cfg_parameter_value.findIndex(element => "parameter_input_" + element.name == parameter.id);
    let name = cfg_parameter_value[i].name;
    let input_id = 'parameter_input_' + name;
    let value_old = cfg_parameter_value[i].current_value;
    let value;
    let min;
    let max;
    switch (cfg_parameter_value[i].type) {
        case "L":
            break;
        case "I":
            value = parseInt($("#" + input_id).val());
            if (isNaN(value)) {
                value = 0;
                $("#" + input_id).val(value);
            }
            min = cfg_parameter_value[i].allowed_values.split(RE_TOKEN_DELIMS)[0];
            max = cfg_parameter_value[i].allowed_values.split(RE_TOKEN_DELIMS)[1];
            if (min != NO_LIMIT && value < parseInt(min)) {
                $("#" + input_id).val(parseInt(min));
            }
            if (max != NO_LIMIT && value > parseInt(max)) {
                $("#" + input_id).val(parseInt(max));
            }
            break;
        case "F":
            value = parseFloat($("#" + input_id).val());
            if (isNaN(value))
                value = 0;
            min = cfg_parameter_value[i].allowed_values.split(RE_TOKEN_DELIMS)[0];
            max = cfg_parameter_value[i].allowed_values.split(RE_TOKEN_DELIMS)[1];
            if (min != NO_LIMIT && value < parseFloat(min)) {
                $("#" + input_id).val(parseFloat(min));
            }
            if (max != NO_LIMIT && value > parseFloat(max)) {
                $("#" + input_id).val(parseFloat(max));
            }
            $("#" + input_id).val(parseFloat($("#" + input_id).val()).toExponential(FLOAT_FRACTION_DIGITS));
            break;
        default:
            console.log("ERROR: Unknown type " + cfg_parameter_value[i].type + " for cfg parameter " + name);
    }
    value = $("#" + input_id).val();
    if (value_old != value) {
        send_cmd(rc_cmds.CMD_RC_CFG_VALUE, name, value);
        set_cfg_file_current('');
        $("#ctl_cfg_file_load_name").val("");
    }
    cfg_parameter_value[i].current_value = $("#" + input_id).val();
}
export function update_parameters() {
    $("#grid_parameters_container *").remove();
    for (let i in cfg_parameter_value) {
        let name = cfg_parameter_value[i].name;
        let value = cfg_parameter_value[i].current_value;
        let div_id = 'parameter_' + name;
        let input_id = 'parameter_input_' + name;
        let label_text = cfg_parameter_value[i].text + ": ";
        $("#grid_parameters_container").append("<div id='" + div_id + "'></div>");
        $("#" + div_id).append("<label for='" + input_id + "'>" + label_text + "</label>");
        switch (cfg_parameter_value[i].type) {
            case "I":
                $("#" + div_id).append("<input type='number' name='" + input_id + "' id='" + input_id + "' onchange=check_parameter(this)>");
                $("#" + input_id).attr('min', parseFloat(cfg_parameter_value[i].allowed_values.split(RE_TOKEN_DELIMS)[0]));
                $("#" + input_id).attr('max', parseFloat(cfg_parameter_value[i].allowed_values.split(RE_TOKEN_DELIMS)[1]));
                $("#" + input_id).val(Math.floor(value));
                break;
            case "L":
                $("#" + div_id).append("<select id='" + input_id + "' onchange=check_parameter(this)></select>");
                for (let k in cfg_parameter_value[i].allowed_values.split(RE_TOKEN_DELIMS)) {
                    $("#" + input_id).append("<option>" + cfg_parameter_value[i].allowed_values.split(RE_TOKEN_DELIMS)[k] + "</option>");
                }
                $("#" + input_id).val(value);
                break;
            case "F":
                $("#" + div_id).append("<input type='text' name='" + input_id + "' id='" + input_id + "' onchange=check_parameter(this)>");
                $("#" + input_id).val(parseFloat(value).toExponential(FLOAT_FRACTION_DIGITS));
                break;
            default:
                console.log("ERROR: Unknown type " + cfg_parameter_value[i].type + " for cfg parameter " + name);
        }
        switch (rc_state) {
            case rc_states.RC_STATE_QUIT:
            case rc_states.RC_STATE_UNDEFINED:
            case rc_states.RC_STATE_GO:
                $("#" + input_id).attr("disabled", "disabled");
                break;
            case rc_states.RC_STATE_HALT:
                $("#" + input_id).removeAttr("disabled");
                if ($('#ctl_trigger_source').val() != "Internal") {
                    $('#parameter_input_timer_period_ms').attr('disabled', 'disabled');
                }
                break;
            default:
                console.log("ERROR: Unknown state: " + rc_state);
                break;
        }
    }
}
export function init_parameters() {
    cfg_parameter_count = 0;
    cfg_parameter_value = [];
    status_clearall(cfg_parameters_states);
}
