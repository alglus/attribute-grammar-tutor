import {DARK_GREY, ERROR_DARK_RED, LIGHT_GREY} from "./joint.attrsys.js";

export function defineAttrsysLinks() {
    const attrsysLink = defineLink();

    defineSymbolLink(attrsysLink);
    defineAttributeLink(attrsysLink);
    defineRedecoratedLink(attrsysLink);
    defineProjectedLink(attrsysLink);
}

function defineLink() {

    return joint.shapes.standard.Link.define('attrsys.Link', {
        connector: {name: 'rounded'},
        attrs: {
            z: 2,
        },

    }, {
        getTools() {
            return [
                new joint.linkTools.Vertices(),
                new joint.linkTools.Remove({distance: '50%'}),
                new joint.linkTools.TargetArrowhead(),
            ];
        },
        showErrorHighlighting(area) {
            this.prop('attrs/line/stroke', ERROR_DARK_RED);
        },
        hideErrorHighlighting(area) {
            this.prop('attrs/line/stroke', LIGHT_GREY);
        },
    });
}

/**
 * Link between symbols
 * @returns new SymbolLink object
 */
function defineSymbolLink(attrsysLink) {

    return attrsysLink.define('attrsys.SymbolLink', {
        router: {name: 'normal'},
        attrs: {
            cursor: 'default',
            line: {
                stroke: LIGHT_GREY,
                strokeWidth: 3,
            }
        },
    });
}


/**
 * Regular link between attributes
 * @returns new AttributeLink object
 */
function defineAttributeLink(attrsysLink) {

    return attrsysLink.define('attrsys.AttributeLink', {
        router: {name: 'manhattan'},
        attrs: {
            line: {
                stroke: DARK_GREY,
                strokeWidth: 2,
            },
        },
    });
}


/**
 * Redecorated link between attributes
 * @returns new AttributeLink object
 */
function defineRedecoratedLink(attrsysLink) {
    // TODO: split common features into one common parent
    return attrsysLink.define('attrsys.RedecoratedLink', {
        router: {name: 'manhattan'},
        attrs: {
            line: {
                stroke: '#46bb00ee',
                strokeWidth: 4,
                fill: 'none',
            },
            lineError: {
                connection: true,
                stroke: 'transparent',
                strokeDasharray: '10, 5',
                strokeWidth: 4,
                fill: 'none',
            },
        },
    }, {
        markup: [{
            tagName: 'path',
            selector: 'line',
        }, {
            tagName: 'path',
            selector: 'lineError',
        }]
    }, {
        showErrorHighlighting(area) {
            this.prop('attrs/lineError/stroke', ERROR_DARK_RED);
        },
        hideErrorHighlighting(area) {
            this.prop('attrs/line/stroke', 'transparent');
        },
    });
}


/**
 * Projected link between attributes
 * @returns new AttributeLink object
 */
function defineProjectedLink(attrsysLink) {

    return attrsysLink.define('attrsys.ProjectedLink', {
        router: {name: 'manhattan'},
        attrs: {
            line: {
                stroke: '#ffbf00ee',
                strokeWidth: 4,
            },
        },
    });
}