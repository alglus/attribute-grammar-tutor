import {cloneElementAndSetNewAttributeValue, disable, emptyArray, enable, ERROR} from "./utils.js";
import {AcyclicityGraph} from "./graph.js";
import {drawDependencyGraph, GRAPH_TYPE} from "./drawDependencyGraph.js";
import {
    checkAcyclicityGraph,
    checkCycleFound,
    checkIterationStable,
    checkTransitiveRelations
} from "./checkAcyclicityGraph.js";


const acyclicityGraphs = [];


/* Show exercise */
export function showStrongAcyclicityExercise() {
    showExerciseContainer();
    showExerciseNotEnabledWarning();
    makeSureExerciseIsCollapsed();
}

function showExerciseContainer() {
    $('#acyclicityExercise').show();
}

function showExerciseNotEnabledWarning() {
    $('#acyclicityExerciseNotEnabledWarning').show();
}

function makeSureExerciseIsCollapsed() {
    // Make sure that the strong acyclicity exercise is created in a collapsed state,
    // because it is only solvable after the first exercise has been complete.
    $('#acyclicityCollapseBtn:not(.collapsed)').click();
}


/* Enable exercise */
export function enableStrongAcyclicityExercise() {
    hideExerciseNotEnabledWarning();
    uncollapseExercise();
}

function hideExerciseNotEnabledWarning() {
    $('#acyclicityExerciseNotEnabledWarning').hide();
}

function uncollapseExercise() {
    $('#acyclicityCollapseBtn.collapsed').click();
}


/* Create exercise */
export function createStrongAcyclicityExercise(grammar) {

    for (let nonterminalIndex = 0; nonterminalIndex < grammar.nonterminals.length; nonterminalIndex++) {

        acyclicityGraphs.push([]); // Add arrays for the production rules.

        const nonterminal = grammar.nonterminals.getAt(nonterminalIndex);

        if (nonterminalIndex > 0) {
            cloneNonterminalContainer(nonterminalIndex);
        }

        setNonterminalTitle(nonterminal, nonterminalIndex);

        createProductionRuleContainers(nonterminal, nonterminalIndex);

        scrollSync('.scrollSync');
    }
}


function cloneNonterminalContainer(newNonterminalIndex) {

    const templateNonterminalContainerHTML = $('.acyclicityNonterminalContainer[data-nonterminal=0]');
    const newNonterminalContainerHTML = cloneElementAndSetNewAttributeValue(templateNonterminalContainerHTML, ['data-nonterminal'], [newNonterminalIndex]);

    const acyclicityFooter = $('#acyclicityFooterContainer');
    newNonterminalContainerHTML.insertBefore(acyclicityFooter);
}

function setNonterminalTitle(nonterminal, nonterminalIndex) {
    $(`.acyclicityNonterminalTitle[data-nonterminal=${nonterminalIndex}]`).html(nonterminal.name);
}

function createProductionRuleContainers(nonterminal, nonterminalIndex) {

    for (let productionRuleIndex = 0; productionRuleIndex < nonterminal.productionRules.length; productionRuleIndex++) {

        acyclicityGraphs[nonterminalIndex].push([]); // Add arrays for the iterations.

        if (productionRuleIndex > 0) {
            cloneProductionRuleContainer(productionRuleIndex, nonterminalIndex);
        }

        const productionRule = nonterminal.productionRules[productionRuleIndex];

        setProductionRuleTitle(productionRule, productionRuleIndex, nonterminalIndex);
    }
}

function cloneProductionRuleContainer(newProductionRuleIndex, nonterminalIndex) {

    const templateProductionRuleContainerHTML = $(`.acyclicityProductionRule[data-nonterminal='${nonterminalIndex}'][data-productionRule='0']`);
    const newProductionRuleContainerHTML = cloneElementAndSetNewAttributeValue(templateProductionRuleContainerHTML, ['data-productionRule'], [newProductionRuleIndex]);

    const elementAfterAllProductionRules = $(`.acyclicityTransitiveRelationsContainer[data-nonterminal=${nonterminalIndex}]`);
    newProductionRuleContainerHTML.insertBefore(elementAfterAllProductionRules);
}

function setProductionRuleTitle(productionRule, productionRuleIndex, nonterminalIndex) {
    $(`.acyclicityProductionRuleText[data-nonterminal=${nonterminalIndex}][data-productionRule=${productionRuleIndex}]`)
        .html(productionRule.toString());
}


/* Add iteration */
export function addIteration(grammar, iterationIndex) {

    for (let nonterminalIndex = 0; nonterminalIndex < grammar.nonterminals.length; nonterminalIndex++) {

        const nonterminal = grammar.nonterminals.getAt(nonterminalIndex);

        addIterationHeader(nonterminalIndex, iterationIndex);

        addGraphCards(grammar, nonterminal, nonterminalIndex, iterationIndex);

        addTransitiveRelation(nonterminal, nonterminalIndex, iterationIndex);
    }

    addIterationFooter(iterationIndex);

    assignFunctionToCheckButton(grammar, iterationIndex);

    scrollToBeginningOfNewIteration(iterationIndex);
}

function addIterationHeader(nonterminalIndex, iterationIndexBase0) {
    const iterationIndexBase1 = iterationIndexBase0 + 1;
    $(`.acyclicityIterationHeaderList[data-nonterminal=${nonterminalIndex}]`).append(`<li>Iteration ${iterationIndexBase1}</li>`);
}

function addGraphCards(grammar, nonterminal, nonterminalIndex, iterationIndex) {

    for (let productionRuleIndex = 0; productionRuleIndex < nonterminal.productionRules.length; productionRuleIndex++) {

        cloneProductionRuleCard(nonterminalIndex, productionRuleIndex, iterationIndex);

        addGraph(grammar, nonterminalIndex, productionRuleIndex, iterationIndex);

        setLinkTypeRadioButtonsIdAndName('Redecorated', nonterminalIndex, productionRuleIndex, iterationIndex);
        setLinkTypeRadioButtonsIdAndName('Projected', nonterminalIndex, productionRuleIndex, iterationIndex);

        setCycleFoundRadioButtonsIdAndName('Yes', nonterminalIndex, productionRuleIndex, iterationIndex);
        setCycleFoundRadioButtonsIdAndName('No', nonterminalIndex, productionRuleIndex, iterationIndex);
    }
}

function cloneProductionRuleCard(nonterminalIndex, productionRuleIndex, newIterationIndex) {

    const templateProductionRuleCardHTML = $(`.acyclicityGraphCardContainer[data-nonterminal='${nonterminalIndex}'][data-productionRule=${productionRuleIndex}][data-iteration='-1']`);
    const newProductionRuleCardHTML = cloneElementAndSetNewAttributeValue(templateProductionRuleCardHTML, ['data-iteration'], [newIterationIndex]);

    const elementBeforeAllProductionCards = $(`.acyclicityGraphsRow[data-nonterminal='${nonterminalIndex}'][data-productionRule=${productionRuleIndex}]`);
    elementBeforeAllProductionCards.append(newProductionRuleCardHTML);
}

function addGraph(grammar, nonterminalIndex, productionRuleIndex, iterationIndex) {
    const graphContainer = $(`.acyclicityGraph[data-nonterminal=${nonterminalIndex}][data-productionRule=${productionRuleIndex}][data-iteration=${iterationIndex}]`);

    const linkTypeInputName = `linkType_${nonterminalIndex}_${productionRuleIndex}_${iterationIndex}`;
    const graph = new AcyclicityGraph(graphContainer, grammar, productionRuleIndex, linkTypeInputName);

    acyclicityGraphs[nonterminalIndex][productionRuleIndex].push(graph);

    drawDependencyGraph(graph, grammar, grammar.nonterminals.getAt(nonterminalIndex).productionRules[productionRuleIndex], GRAPH_TYPE.acyclicity);
}

function setLinkTypeRadioButtonsIdAndName(linkType, nonterminalIndex, productionRuleIndex, iterationIndex) {
    const newId = `linkType${linkType}_${nonterminalIndex}_${productionRuleIndex}_${iterationIndex}`;
    const newName = `linkType_${nonterminalIndex}_${productionRuleIndex}_${iterationIndex}`;

    const linkTypeSelector = `.linkType${linkType}[data-nonterminal=${nonterminalIndex}][data-productionRule=${productionRuleIndex}][data-iteration=${iterationIndex}]`;

    $(`${linkTypeSelector} > input`).attr({'id': newId, 'name': newName});
    $(`${linkTypeSelector} > label`).attr('for', newId);
}

function setCycleFoundRadioButtonsIdAndName(yesNo, nonterminalIndex, productionRuleIndex, iterationIndex) {

    const newId = `cycleFound${yesNo}_${nonterminalIndex}_${productionRuleIndex}_${iterationIndex}`;
    const newName = `cycleFound_${nonterminalIndex}_${productionRuleIndex}_${iterationIndex}`;

    const cycleFoundSelector = `.cycleFound${yesNo}[data-nonterminal=${nonterminalIndex}][data-productionRule=${productionRuleIndex}][data-iteration=${iterationIndex}]`;

    $(`${cycleFoundSelector} > input`).attr({'id': newId, 'name': newName});
    $(`${cycleFoundSelector} > label`).attr('for', newId);
}

function addTransitiveRelation(nonterminal, nonterminalIndex, iterationIndex) {

    cloneTransitiveRelation(nonterminalIndex, iterationIndex);

    const transitiveRelationsItem = `.acyclicityTransitiveRelationsItem[data-nonterminal=${nonterminalIndex}][data-iteration=${iterationIndex}]`;

    setTransitiveRelationName(transitiveRelationsItem, nonterminal);
    setTransitiveRelationId(transitiveRelationsItem, nonterminalIndex, iterationIndex);
}

function cloneTransitiveRelation(nonterminalIndex, iterationIndex) {
    const newTransitiveRelation = cloneElementAndSetNewAttributeValue(
        $(`.acyclicityTransitiveRelationsItem[data-nonterminal=${nonterminalIndex}][data-iteration='-1']`),
        ['data-nonterminal', 'data-iteration'],
        [nonterminalIndex, iterationIndex]
    );
    const transitiveRelationsList = $(`.acyclicityTransitiveRelationsList[data-nonterminal=${nonterminalIndex}]`);
    transitiveRelationsList.append(newTransitiveRelation);
}

function setTransitiveRelationName(transitiveRelationsItem, nonterminal) {
    $(`${transitiveRelationsItem} i`).html(nonterminal.name);
}

function setTransitiveRelationId(transitiveRelationsItem, nonterminalIndex, iterationIndex) {
    const newId = `transitiveRelation_${nonterminalIndex}_${iterationIndex}`;
    $(`${transitiveRelationsItem} label`).attr('for', newId);
    $(`${transitiveRelationsItem} input`).attr('id', newId);
}

function addIterationFooter(iterationIndex) {

    if (iterationIndex === 0)
        unhideAcyclicityFooter();

    cloneIterationFooter(iterationIndex);

    setIterationStableRadioButtonsIdAndName('Yes', iterationIndex);
    setIterationStableRadioButtonsIdAndName('No', iterationIndex);

    setIterationCheckButtonId(iterationIndex);
}

function unhideAcyclicityFooter() {
    $('#acyclicityFooterContainer').show();
}

function cloneIterationFooter(newIterationIndex) {
    const templateIterationFooterHTML = $('.acyclicityIterationFooter[data-iteration="-1"]');
    const newIterationFooterHTML = cloneElementAndSetNewAttributeValue(templateIterationFooterHTML, ['data-iteration'], [newIterationIndex]);

    $('#acyclicityFooterList').append(newIterationFooterHTML);
}

function setIterationStableRadioButtonsIdAndName(yesNo, iterationIndex) {
    const newId = `stable${yesNo}_${iterationIndex}`;
    const newName = `stable_${iterationIndex}`;

    const stableSelector = `.stable${yesNo}[data-iteration=${iterationIndex}]`;

    $(`${stableSelector} > input`).attr({'id': newId, 'name': newName});
    $(`${stableSelector} > label`).attr('for', newId);
}

function setIterationCheckButtonId(iterationIndex) {
    const newId = `iterationCheck_${iterationIndex}`;
    const buttonParentSelector = `.acyclicityIterationFooter[data-iteration=${iterationIndex}]`;

    $(`${buttonParentSelector} button`).attr('id', newId);
}


/* Scroll */
function scrollToBeginningOfNewIteration(newIterationIndex) {
    const iterationHeadingListSelector = '.acyclicityIterationHeaderList[data-nonterminal=0]';
    const newIterationTitle = $(`${iterationHeadingListSelector} > li`).eq(newIterationIndex);

    scrollTo(newIterationTitle.get(0), '.scrollSync');
}

/*
 * Adds an event listener to every element of the 'selector'.
 * When a mouse is over one of those elements and the element starts to scroll (which means, that the user
 * is moving the element using the scroll bar), the scroll position of all other elements is automatically updated.
 */
function scrollSync(selector) {

    let active = null;

    document.querySelectorAll(selector).forEach(function (element) {
        element.addEventListener("mouseenter", function (e) {
            active = e.target;
        });

        element.addEventListener("scroll", function (e) {
            if (e.target !== active) return;

            document.querySelectorAll(selector).forEach(function (target) {
                if (active === target) return;

                target.scrollLeft = active.scrollLeft;
            });
        });
    });
}

function scrollTo(DOM, scrollSelector) {
    scrollToFarRight(scrollSelector);
    waitForScrollToEndAndThenScrollIntoView(DOM, scrollSelector);
}

function waitForScrollToEndAndThenScrollIntoView(DOM, scrollSelector) {
    let lastX = {val: 0};

    // The lag of 200ms adds a certain 'smoothness' to the effect.
    const waitInterval = setInterval(checkForScrollEnd, 200, lastX);

    function checkForScrollEnd(lastX) {
        const lastElementOfSelector = $(scrollSelector).last();
        const currentX = lastElementOfSelector.scrollLeft();

        if (currentX === lastX.val) {
            DOM.scrollIntoView({behavior: 'smooth'});
            clearInterval(waitInterval);
        } else {
            lastX.val = currentX;
        }
    }
}

function scrollToFarRight(scrollSelector) {

    const allScrollElements = $(scrollSelector);
    const widthOfFirstHeader = $('.acyclicityIterationHeaderContainer').width();

    allScrollElements.each(function () {
        // Take a very large width, to make sure we definitely scroll to the very far right.
        $(this).scrollLeft(widthOfFirstHeader * 100);
    })
}


/* Check */
function assignFunctionToCheckButton(grammar, iterationIndex) {
    const checkButton = $(`#iterationCheck_${iterationIndex}`);
    checkButton.click(() => checkIteration(grammar, iterationIndex));
}

function checkIteration(grammar, iterationIndex) {

    clearCheckIterationErrors(iterationIndex);

    let errorFound = false;

    // Check iteration stable
    const iterationStableAnswer = $(`input:radio[name=stable_${iterationIndex}]:checked`).val();
    const iterationStableCorrection = checkIterationStable(grammar, iterationStableAnswer, iterationIndex);
    if (iterationStableCorrection === ERROR) errorFound = true;

    for (let nonterminalIndex = 0; nonterminalIndex < acyclicityGraphs.length; nonterminalIndex++) {

        // Check transitive relations
        const transitiveRelationsAnswer = $(`#transitiveRelation_${nonterminalIndex}_${iterationIndex}`).val();
        const transitiveRelationsCorrection = checkTransitiveRelations(grammar, transitiveRelationsAnswer, nonterminalIndex, iterationIndex);
        if (transitiveRelationsCorrection === ERROR) errorFound = true;

        for (let productionRuleIndex = 0; productionRuleIndex < acyclicityGraphs[nonterminalIndex].length; productionRuleIndex++) {

            // Check cycle found
            const cycleFoundAnswer = $(`input:radio[name=cycleFound_${nonterminalIndex}_${productionRuleIndex}_${iterationIndex}]:checked`).val();
            const cycleFoundCorrection = checkCycleFound(grammar, cycleFoundAnswer, nonterminalIndex, productionRuleIndex, iterationIndex);
            if (cycleFoundCorrection === ERROR) errorFound = true;

            // Check graph
            const graph = acyclicityGraphs[nonterminalIndex][productionRuleIndex][iterationIndex];
            const graphCorrection = checkAcyclicityGraph(grammar, graph, nonterminalIndex, productionRuleIndex, iterationIndex);
            if (graphCorrection === ERROR) errorFound = true;

            if (cycleFoundCorrection !== ERROR && graphCorrection !== ERROR) {
                const graphCorrectIcon = $(`.acyclicityCycleFound[data-nonterminal=${nonterminalIndex}][data-productionRule=${productionRuleIndex}][data-iteration=${iterationIndex}] > svg.acyclicityGraphCorrectIcon`)
                graphCorrectIcon.show();
            }
        }
    }

    if (errorFound) {
        redFlashOnCheckButton(iterationIndex);
    }

    if (!errorFound && iterationUnstable(grammar, iterationIndex)) {
        setCheckButtonCorrect(iterationIndex);
        freezeIteration(iterationIndex);
        addIteration(grammar, iterationIndex + 1);
    }
}

function iterationUnstable(grammar, iterationIndex) {
    return grammar.iterationStable[iterationIndex] === 'no';
}


/* Errors */
const tooltips = [];

function clearCheckIterationErrors(iterationIndex) {
    unhighlightText();
    unhighlightRadio();
    unhighlightTextInput();
    hideWarningIcons();
    hideCorrectIcons();
    removeAllTooltips();
    removeRedFlashFromCheckButton(iterationIndex);
}

export function highlightTextAsError(jQuerySelector) {
    jQuerySelector.addClass('errorText');
}

function unhighlightText() {
    $('.errorText').removeClass('errorText');
}

export function highlightRadioAsError(jQuerySelector) {
    jQuerySelector.addClass('errorRadio');
}

function unhighlightRadio() {
    $('.errorRadio').removeClass('errorRadio');
}

export function highlightTextInputAsError(jQuerySelector) {
    jQuerySelector.addClass('errorTextInput');
}

function unhighlightTextInput() {
    $('.errorTextInput').removeClass('errorTextInput');
}

export function hideWarningIcons() {
    $(`.acyclicityCycleFound > svg.acyclicityWarningIcon`).hide();
}

export function hideCorrectIcons() {
    $(`.acyclicityCycleFound > svg.acyclicityGraphCorrectIcon`).hide();
}

function redFlashOnCheckButton(iterationIndex) {
    const button = $(`#iterationCheck_${iterationIndex}`);

    button.addClass('redFlash');

    setTimeout(function () {
        button.removeClass('redFlash');
    }, 800);
}

function removeRedFlashFromCheckButton(iterationIndex) {
    $(`#iterationCheck_${iterationIndex}`).removeClass('redFlash');
}

function setCheckButtonCorrect(iterationIndex) {
    const button = $(`#iterationCheck_${iterationIndex}`);

    button.removeClass('btn-primary');
    button.addClass('btn-success');
}


export function addTooltip(jQuerySelector, tooltipText) {
    jQuerySelector.attr({
        'data-bs-toggle': 'tooltip',
        'data-bs-placement': 'top',
        'data-bs-original-title': tooltipText,
    });
    jQuerySelector.tooltip();
    tooltips.push(jQuerySelector);
}

export function addHTMLTooltip(jQuerySelector, messages) {
    jQuerySelector.attr({
        'data-bs-toggle': 'tooltip',
        'data-bs-placement': 'top',
        'data-bs-html': 'true',
        'data-bs-original-title': convertToTooltipText(messages),
    });
    jQuerySelector.tooltip();
    tooltips.push(jQuerySelector);
}

function convertToTooltipText(messages) {
    let text = '<ul class="listInTooltip">';
    for (const message of messages) {
        text += `<li>${message}</li>`;
    }
    text += '</ul>';
    return text;
}

function removeAllTooltips() {
    for (const tooltipSelector of tooltips) {
        tooltipSelector.tooltip('dispose');
    }
    emptyArray(tooltips);
}


/* Freeze iteration */
function freezeIteration(grammar, iterationIndex) {
    disableCycleFoundRadioButtons(iterationIndex);
    disableTransitiveRelationInput(iterationIndex);
    disableLinkTypeRadioButtons(iterationIndex);
    disableIterationStableRadioButtons(iterationIndex);
    disableCheckIterationButton(iterationIndex);
    disableAllGraphs(grammar, iterationIndex);
}

function disableCycleFoundRadioButtons(iterationIndex) {
    disable($(`.acyclicityCycleFound[data-iteration=${iterationIndex}] input:radio`));
}

function disableTransitiveRelationInput(iterationIndex) {
    disable($(`.acyclicityTransitiveRelationsItem[data-iteration=${iterationIndex}] input:text`));
}

function disableLinkTypeRadioButtons(iterationIndex) {
    disable($(`.acyclicityLinkTypesButton[data-iteration=${iterationIndex}] input:radio`));
}

function disableIterationStableRadioButtons(iterationIndex) {
    disable($(`.acyclicityIterationFooter[data-iteration=${iterationIndex}] input:radio`));
}

function disableCheckIterationButton(iterationIndex) {
    disable($(`#iterationCheck_${iterationIndex}`));
}

function disableAllGraphs(grammar, iterationIndex) {
    for (let nonterminalIndex = 0; nonterminalIndex < grammar.nonterminals.length; nonterminalIndex++) {
        for (let productionIndex = 0; productionIndex < grammar.nonterminals.getAt(nonterminalIndex).productionRules.length; productionIndex++) {
            const graph = acyclicityGraphs[nonterminalIndex][productionIndex][iterationIndex];
            graph.disable();
        }
    }
}


/* Delete exercise */
export function deleteStrongAcyclicityExercise() {
    hideExerciseContainer();
    removeAllGraphs();
    deleteAllNonterminalContainers();
    deleteAllProductionRuleContainers();
    deleteAllIterationHeaders();
    deleteAllIterationContainers();
    deleteAllTransitiveRelations();
    deleteAllIterationFooters();
    emptyAcyclicityGraphsArray();
}

function hideExerciseContainer() {
    $('#acyclicityExercise').hide();
}

function removeAllGraphs() {
    for (let nonterminalIndex = 0; nonterminalIndex < acyclicityGraphs.length; nonterminalIndex++) {
        for (let productionIndex = 0; productionIndex < acyclicityGraphs[nonterminalIndex].length; productionIndex++) {
            for (let iterationIndex = 0; iterationIndex < acyclicityGraphs[nonterminalIndex][productionIndex].length; iterationIndex++) {
                removeGraph(nonterminalIndex, productionIndex, iterationIndex);
                removeEventHandlersFromCheckButton(iterationIndex);
            }
        }
    }
}

function removeGraph(nonterminalIndex, productionIndex, iterationIndex) {
    const graph = acyclicityGraphs[nonterminalIndex][productionIndex][iterationIndex];
    graph.graph.clear();
    graph.paper.remove(); // This is necessary to remove any event handlers in the graph.
}

function removeEventHandlersFromCheckButton(iterationCheck) {
    $(`#iterationCheck_${iterationCheck}`).off('click');
}

function deleteAllNonterminalContainers() {
    $('.acyclicityNonterminalContainer').not(':first').remove();
}

function deleteAllProductionRuleContainers() {
    $('.acyclicityProductionRule').not(':first').remove();
}

function deleteAllIterationHeaders() {
    $('.acyclicityIterationHeaderList').empty();
}

function deleteAllIterationContainers() {
    $('.acyclicityGraphCardContainer').not(':first').remove();
}

function deleteAllTransitiveRelations() {
    $('.acyclicityTransitiveRelationsItem').not(':first').remove();
}

function deleteAllIterationFooters() {
    $('.acyclicityIterationFooter').not(':first').remove();
}

function emptyAcyclicityGraphsArray() {
    emptyArray(acyclicityGraphs);
}