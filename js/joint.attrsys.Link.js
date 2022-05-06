import {DARK_GREY, ERROR_DARK_RED, LIGHT_GREY} from "./joint.attrsys.js";

export function defineAttrsysLinks() {

    const attrsysLink = defineLink();
    defineSymbolLink(attrsysLink);
    defineAttributeLink(attrsysLink);

    const acyclicityLink = defineAcyclicityLink(attrsysLink);
    defineRedecoratedLink(acyclicityLink);
    defineProjectedLink(acyclicityLink);
}


/**
 * Parent class of all links
 * @returns new Link object
 */
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
    }, {
        showErrorHighlighting(area) {
            this.prop('attrs/line/stroke', ERROR_DARK_RED);
        },
        hideErrorHighlighting(area) {
            this.prop('attrs/line/stroke', LIGHT_GREY);
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
    }, {
        showErrorHighlighting(area) {
            this.prop('attrs/line/stroke', ERROR_DARK_RED);
        },
        hideErrorHighlighting(area) {
            this.prop('attrs/line/stroke', DARK_GREY);
        },
    });
}


/**
 * Parent class of the links used in the acyclicity exercise.
 * @returns new AcyclicityLink object
 */
function defineAcyclicityLink(attrsysLink) {

    return attrsysLink.define('attrsys.AcyclicityLink', {
        router: {name: 'manhattan'},
        attrs: {
            line: {
                strokeWidth: 4,
                fill: 'none',
            },
            lineError: {
                connection: true,
                stroke: 'transparent',
                strokeDasharray: '5, 10',
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
        },],
        showErrorHighlighting(area) {
            this.prop('attrs/lineError/stroke', ERROR_DARK_RED);
        },
        hideErrorHighlighting(area) {
            this.prop('attrs/line/stroke', 'transparent');
        },
    });
}


/**
 * Redecorated link between attributes
 * @returns new RedecoratedLink object
 */
function defineRedecoratedLink(acyclicityLink) {

    return acyclicityLink.define('attrsys.RedecoratedLink', {
        attrs: {
            line: {
                stroke: '#46bb00ee',
            },
        },
    });
}


/**
 * Projected link between attributes
 * @returns new ProjectedLink object
 */
function defineProjectedLink(acyclicityLink) {

    return acyclicityLink.define('attrsys.ProjectedLink', {
        router: {name: 'manhattan'},
        attrs: {
            line: {
                stroke: '#ffbf00ee',
            },
        },
    });
}