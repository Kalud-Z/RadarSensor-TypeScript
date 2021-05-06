import { arraybuffer2string, status_iscomplete, status_isset, status_set, struct } from './basics.js';
import { cfg_parameters_states, init_parameters } from './config_params.js';
import { controls_states, init_controls, node_index_required } from './controls.js';
import { rc_cmds, request_initial_config, send_cmd } from './commands.js';
import { data_bitwidth, data_datatype, data_image_range_x, data_image_range_y, data_image_size_x, data_image_size_y, data_image_start_x, data_image_start_y, graphics_states, init_graphics, scale_legend_x, scale_legend_y, scale_world_range_x, scale_world_range_y, scale_world_start_x, scale_world_start_y, set_data_bitwidth, set_data_datatype, set_data_image_range_x, set_data_image_range_y, set_data_image_size_x, set_data_image_size_y, set_data_image_start_x, set_data_image_start_y, set_res_x, set_res_y, set_scale_legend_x, set_scale_legend_y, set_scale_world_range_x, set_scale_world_range_y, set_scale_world_start_x, set_scale_world_start_y, update_graphics, } from './graphics.js';
export const HEADER_TAG_PIPELINE = "PH";
export const HEADER_TAG_NODE = "NH";
export const HEADER_TAG_DATA = "DH";
export const HEADER_TAG_COMMAND = "CH";
export const HEADER_USER_DATA_SIZE = 2;
export const TYPE_HEADER_SIZE_BYTES = 4 + 4 * HEADER_USER_DATA_SIZE;
export const type_header_struct = struct('tag', 'value', 'user_data');
export function arraybuffer2type_header(arraybuffer) {
    let dv = new DataView(arraybuffer);
    let offset_tag = 0;
    let offset_value = 2;
    let offset_user_data = 4;
    return type_header_struct(arraybuffer2string(arraybuffer.slice(offset_tag, offset_value)), dv.getInt16(offset_value, true), arraybuffer.slice(offset_user_data));
}
export const NODE_HEADER_SIZE_BYTES = 100 + 4 * HEADER_USER_DATA_SIZE;
export const NODE_LABEL_SIZE_BYTES = 31;
export const node_header_struct = struct('tag', 'mode', 'label_x', 'label_y', 'datatype', 'bitwidth', 'image_size_x', 'image_start_x', 'image_range_x', 'image_size_y', 'image_start_y', 'image_range_y', 'world_start_x', 'world_range_x', 'world_start_y', 'world_range_y', 'bufadr_p', 'user_data');
export let nodes_headers;
export function arraybuffer2node_header(arraybuffer, node_index) {
    let dv = new DataView(arraybuffer);
    let offset_tag = TYPE_HEADER_SIZE_BYTES + node_index * NODE_HEADER_SIZE_BYTES;
    let offset_mode = offset_tag + 2;
    let offset_labels = offset_mode + 2;
    let offset_datatype = offset_labels + 2 * NODE_LABEL_SIZE_BYTES;
    let offset_bitwidth = offset_datatype + 1;
    let offset_image = offset_bitwidth + 1;
    let offset_world = offset_image + 12;
    let offset_bufadr = offset_world + 16;
    let offset_user_data = offset_bufadr + 4;
    return node_header_struct(arraybuffer2string(arraybuffer.slice(offset_tag, offset_tag + 2)), dv.getUint16(offset_mode, true), arraybuffer2string(arraybuffer.slice(offset_labels, offset_labels + NODE_LABEL_SIZE_BYTES)), arraybuffer2string(arraybuffer.slice(offset_labels + NODE_LABEL_SIZE_BYTES, offset_labels + 2 * NODE_LABEL_SIZE_BYTES)), arraybuffer2string(arraybuffer.slice(offset_datatype, offset_datatype + 1)), dv.getUint8(offset_bitwidth), dv.getUint16(offset_image, true), dv.getUint16(offset_image + 2, true), dv.getUint16(offset_image + 4, true), dv.getUint16(offset_image + 6, true), dv.getUint16(offset_image + 8, true), dv.getUint16(offset_image + 10, true), dv.getFloat32(offset_world, true), dv.getFloat32(offset_world + 4, true), dv.getFloat32(offset_world + 8, true), dv.getFloat32(offset_world + 12, true), dv.getUint32(offset_bufadr, true), arraybuffer.slice(offset_user_data));
}
export function process_pipeline_headers(data_buffer) {
    let number_of_nodes = arraybuffer2type_header(data_buffer.slice(0, TYPE_HEADER_SIZE_BYTES)).value;
    nodes_headers = [];
    for (let i = 0; i < number_of_nodes; i++) {
        nodes_headers[i] = arraybuffer2node_header(data_buffer, i);
    }
    if ((!status_iscomplete(cfg_parameters_states)) ||
        (!status_iscomplete(controls_states))) {
        console.log("WARNING: Pipeline header received, but basic configuration is not complete");
        init_parameters();
        init_controls();
        request_initial_config();
        return;
    }
    if ((!status_isset(graphics_states, 'GRAPHICS_STATE_NODES_NAMES')) ||
        (!status_isset(graphics_states, 'GRAPHICS_STATE_NODES_OMODES'))) {
        console.log("WARNING: Pipeline header received, but nodes names/output configuration not complete");
        init_graphics();
        send_cmd(rc_cmds.CMD_RC_NODES_NAMES);
        send_cmd(rc_cmds.CMD_RC_NODES_OMODES);
        return;
    }
    if (node_index_required < 0) {
        set_scale_legend_x('range');
        set_scale_legend_y('velocity');
        set_data_datatype('U');
        set_data_bitwidth(8);
        set_data_image_size_x(1);
        set_data_image_size_y(1);
        set_data_image_start_x(0);
        set_data_image_start_y(0);
        set_data_image_range_x(0);
        set_data_image_range_y(0);
        set_scale_world_start_x(0);
        set_scale_world_start_y(0);
        set_scale_world_range_x(0);
        set_scale_world_range_y(0);
        set_res_x(0);
        set_res_y(0);
        status_set(graphics_states, 'GRAPHICS_STATE_SCALES');
        update_graphics();
        return;
    }
    let scale_parameters_changed = ((scale_legend_x != nodes_headers[node_index_required].label_x) ||
        (scale_legend_y != nodes_headers[node_index_required].label_y) ||
        (data_datatype != nodes_headers[node_index_required].datatype) ||
        (data_bitwidth != nodes_headers[node_index_required].bitwidth) ||
        (data_image_size_x != nodes_headers[node_index_required].image_size_x) ||
        (data_image_size_y != nodes_headers[node_index_required].image_size_y) ||
        (data_image_start_x != nodes_headers[node_index_required].image_start_x) ||
        (data_image_start_y != nodes_headers[node_index_required].image_start_y) ||
        (data_image_range_x != nodes_headers[node_index_required].image_range_x) ||
        (data_image_range_y != nodes_headers[node_index_required].image_range_y) ||
        (scale_world_start_x != nodes_headers[node_index_required].world_start_x) ||
        (scale_world_start_y != nodes_headers[node_index_required].world_start_y) ||
        (scale_world_range_x != nodes_headers[node_index_required].world_range_x) ||
        (scale_world_range_y != nodes_headers[node_index_required].world_range_y));
    if (scale_parameters_changed) {
        set_scale_legend_x(nodes_headers[node_index_required].label_x);
        set_scale_legend_y(nodes_headers[node_index_required].label_y);
        set_data_datatype(nodes_headers[node_index_required].datatype);
        set_data_bitwidth(nodes_headers[node_index_required].bitwidth);
        set_data_image_size_x(nodes_headers[node_index_required].image_size_x);
        set_data_image_size_y(nodes_headers[node_index_required].image_size_y);
        set_data_image_start_x(nodes_headers[node_index_required].image_start_x);
        set_data_image_start_y(nodes_headers[node_index_required].image_start_y);
        set_data_image_range_x(nodes_headers[node_index_required].image_range_x);
        set_data_image_range_y(nodes_headers[node_index_required].image_range_y);
        set_scale_world_start_x(nodes_headers[node_index_required].world_start_x);
        set_scale_world_start_y(nodes_headers[node_index_required].world_start_y);
        set_scale_world_range_x(nodes_headers[node_index_required].world_range_x);
        set_scale_world_range_y(nodes_headers[node_index_required].world_range_y);
        set_res_x(scale_world_range_x / (data_image_range_x - 1));
        set_res_y(scale_world_range_y / (data_image_range_y - 1));
        status_set(graphics_states, 'GRAPHICS_STATE_SCALES');
        update_graphics();
    }
}
