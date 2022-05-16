import {DARK_GREY, ERROR_DARK_RED, LIGHT_GREY} from "./joint.attrsys.js";
import {getRandomIntInclusive} from "./utils.js";

export function defineAttrsysLinks() {

    const attrsysLink = defineLink();
    defineSymbolLink(attrsysLink);

    const attributeLink = defineAttributeLink(attrsysLink);
    defineRegularAttributeLink(attributeLink);

    const acyclicityLink = defineAcyclicityLink(attributeLink);
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
            line: {
                fill: 'none',
            },
            lineHighlight: {
                connection: true,
                stroke: 'transparent',
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
            selector: 'lineHighlight',
        },],
        getTools() {
            return [
                new joint.linkTools.Vertices({snapRadius: 10}),
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
        showErrorHighlighting() {
            this.prop('attrs/line/stroke', ERROR_DARK_RED);
        },
        hideErrorHighlighting() {
            this.prop('attrs/line/stroke', LIGHT_GREY);
        },
    });
}


/**
 * Parent class of attribute links
 * @returns new AttributeLink object
 */
function defineAttributeLink(attrsysLink) {

    return attrsysLink.define('attrsys.AttributeLink', {
        router: {
            name: 'manhattan', args: {
                // The step is the virtual grid, to which the manhattan route snaps to.
                // Reduce it from the default=10, so that the random padding can use more of its values.
                step: 2
            }
        },
    }, {}, {
        createWithRandomPadding: function () {
            const newLink = new this();

            // Randomise the padding, so that nearby links do not overlap, and it is easier to tell them apart.
            const padding = getRandomIntInclusive(10, 30);

            newLink.prop('router/args/padding', padding);
            return newLink;
        }
    });
}


/**
 * Regular link between attributes
 * @returns new RegularAttributeLink object
 */
function defineRegularAttributeLink(attributeLink) {

    return attributeLink.define('attrsys.RegularAttributeLink', {
        attrs: {
            line: {
                stroke: DARK_GREY,
                strokeWidth: 2,
            },
        },
    }, {
        showErrorHighlighting() {
            this.prop('attrs/line/stroke', ERROR_DARK_RED);
        },
        hideErrorHighlighting() {
            this.prop('attrs/line/stroke', DARK_GREY);
        },
    });
}


/**
 * Parent class of the links used in the acyclicity exercise.
 * @returns new AcyclicityLink object
 */
function defineAcyclicityLink(attributeLink) {

    return attributeLink.define('attrsys.AcyclicityLink', {
        attrs: {
            lineError: {
                connection: true,
                stroke: 'transparent',
                strokeDasharray: '10, 2',
                strokeWidth: 6,
                fill: 'none',
            },
            line: {
                strokeWidth: 3,
            },
        },
    }, {
        markup: [{
            tagName: 'path',
            selector: 'lineError',
        },{
            tagName: 'path',
            selector: 'line',
        },{
            tagName: 'path',
            selector: 'lineHighlight',
        },],
        showErrorHighlighting() {
            this.prop('attrs/lineError/stroke', 'rgba(255,0,0,0.6)');
        },
        hideErrorHighlighting() {
            this.prop('attrs/lineError/stroke', 'transparent');
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
                stroke: '#46BB00',
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
                stroke: 'rgb(255,191,0)',
            },
        },
    });
}