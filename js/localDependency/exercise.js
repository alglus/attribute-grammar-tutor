import {DependencyGraph} from '../joint/graph.js';
import {checkLocalDependencyGraph} from "./check.js";
import {arrayIsEmpty, cloneElementAndSetNewAttributeValue, emptyArray} from '../utils.js';
import {
    drawDependencyGraph,
    drawSyntaxTree,
    GRAPH_TYPE,
    recenterGraph,
    recenterIfGraphOutOfFrame
} from "../joint/drawGraph.js";
import {addIteration, enableStrongAcyclicityExercise} from "../strongAcyclicity/exercise.js";


const localDependencyGraphs = [];
let graphCorrectnessObserver;


/* Show exercise */
export function showLocalDependencyExercise() {
    showExerciseContainer();
    makeSureExerciseIsNotCollapsed();
}

function showExerciseContainer() {
    $('#dependenciesExercise').slideDown('fast');
}

function makeSureExerciseIsNotCollapsed() {
    // If the dependencies exercise has been collapsed before clicking the edit button, then it will stay collapsed
    // after pressing ApplyGrammar again. In order to prevent this, we check if the exercise was collapsed by searching
    // for the corresponding class and then 'manually clicking' that button to open the accordion.
    $('#dependenciesCollapseBtn.collapsed').trigger('click');
}


/* Create exercise */
export function createLocalDependencyExercise(grammar) {

    createContainerForTheGraphInTheTemplateCard();

    createAllGraphs(grammar);

    setFunctionForCheckAllButton(grammar);
    setFunctionForDrawAllTreesButton(grammar);
    setFunctionForShowAllSolutionsButton(grammar);

    graphCorrectnessObserver = new GraphCorrectnessObserver(grammar, grammar.productionRules.length);
}

function createContainerForTheGraphInTheTemplateCard() {
    const graphContainerHTML = $('<div class="card-body dependenciesGraph" data-index="0"></div>');
    const elementRightBeforeGraphContainer = $('.dependenciesGraphCardHeader[data-index=0]');

    graphContainerHTML.insertAfter(elementRightBeforeGraphContainer);
}

function createAllGraphs(grammar) {

    for (let i = 0; i < grammar.productionRules.length; i++) {

        createNewGraphCard(i);

        setTitleOfGraphCard(i, grammar);

        setFunctionForCheckButton(i, grammar);
        setFunctionForClearButton(i);
        setFunctionForDrawTreeButton(i, grammar);
        setFunctionForShowSolutionButton(i, grammar);
        setFunctionForRecenterButton(i);
        setFunctionForShowErrorsButton(i);

        hideGraphErrorsButton(i);
        hideGraphCorrectIcon(i);

        createNewGraph(i, grammar);
    }
}

function createNewGraphCard(productionRuleIndex) {

    // The first dependencies graph card (index 0) is already present in the html as a template.
    // So we need to clone it, if there are more graph cards that need to be created.
    if (productionRuleIndex >= 1) {

        const templateDependenciesGraphCard = $('.dependenciesGraphCard[data-index=0]');

        const newDependenciesGraphCard = cloneElementAndSetNewAttributeValue(templateDependenciesGraphCard, ['data-index'], [productionRuleIndex]);
        templateDependenciesGraphCard.parent().append(newDependenciesGraphCard);
    }
}

function setTitleOfGraphCard(productionRuleIndex, grammar) {

    const graphCardTitle = $(`.dependenciesGraphCardTitle[data-index=${productionRuleIndex}]`);
    const titleText = grammar.productionRules[productionRuleIndex].toString()

    graphCardTitle.html(titleText);
}

function setFunctionForRecenterButton(productionRuleIndex) {
    $(`.dependenciesRecenterBtn[data-index=${productionRuleIndex}]`).on('click',() => recenterGraph(localDependencyGraphs[productionRuleIndex]));
}

function createNewGraph(productionRuleIndex, grammar) {

    const graphContainer = $(`.dependenciesGraph[data-index=${productionRuleIndex}]`);

    const graph = new DependencyGraph(graphContainer, grammar, productionRuleIndex);
    localDependencyGraphs.push(graph);
}


/* Check */
function setFunctionForCheckButton(productionRuleIndex, grammar) {

    const checkButton = $(`.dependenciesCheckBtn[data-index=${productionRuleIndex}]`);
    checkButton.on('click',() => check(productionRuleIndex, grammar));
}

function setFunctionForCheckAllButton(grammar) {

    const checkAllButton = $('#dependenciesCheckAllBtn');
    checkAllButton.on('click',() => checkAll(grammar));
}

function checkAll(grammar) {
    for (let i = 0; i < localDependencyGraphs.length; i++) {
        check(i, grammar);
    }
}

function check(graphIndex, grammar) {

    const graphErrors = [];

    resetErrors(graphIndex);
    hideGraphCorrectIcon(graphIndex);

    checkLocalDependencyGraph(localDependencyGraphs[graphIndex], grammar, graphIndex, graphErrors);

    addGraphErrors(graphIndex, graphErrors);
    showEitherErrorButtonOrCorrectIcon(graphIndex, graphErrors);
}


/* Clear */
export function clearAllGraphs() {
    for (let i = 0; i < localDependencyGraphs.length; i++) {
        clearGraph(i);
    }
}

function setFunctionForClearButton(productionRuleIndex) {

    const graphClearButton = $(`.dependenciesClearBtn[data-index=${productionRuleIndex}]`);
    graphClearButton.on('click',() => clearGraph(productionRuleIndex));
}

function clearGraph(graphIndex) {
    localDependencyGraphs[graphIndex].graph.clear();
    localDependencyGraphs[graphIndex].resetScale();
    localDependencyGraphs[graphIndex].clearHighlightedElementsList();
}


/* Draw tree */
function setFunctionForDrawAllTreesButton(grammar) {

    const drawAllTreesButton = $('#dependenciesDrawAllBtn');

    drawAllTreesButton.on('click',function () {
        clearAllGraphs();
        drawAllSyntaxTrees(grammar);
    });
}

function setFunctionForDrawTreeButton(productionRuleIndex, grammar) {

    const drawTreeButton = $(`.dependenciesDrawBtn[data-index=${productionRuleIndex}]`);

    drawTreeButton.on('click',function () {
        clearGraph(productionRuleIndex);
        drawSyntaxTree(localDependencyGraphs[productionRuleIndex], grammar.productionRules[productionRuleIndex], GRAPH_TYPE.localDependency);
        recenterIfGraphOutOfFrame(localDependencyGraphs[productionRuleIndex]);
    });
}

function drawAllSyntaxTrees(grammar) {

    for (let i = 0; i < localDependencyGraphs.length; i++) {

        const graph = localDependencyGraphs[i];
        const productionRule = grammar.productionRules[i];

        drawSyntaxTree(graph, productionRule, GRAPH_TYPE.localDependency);
        recenterIfGraphOutOfFrame(graph);
    }
}


/* Show solution */
function setFunctionForShowAllSolutionsButton(grammar) {

    const showAllSolutionsButton = $('#dependenciesAllSolutionsBtn');

    showAllSolutionsButton.on('click',function () {
        clearAllGraphs();
        showAllSolutions(grammar);
    });
}

function setFunctionForShowSolutionButton(productionRuleIndex, grammar) {

    const showSolutionButton = $(`.dependenciesSolutionBtn[data-index=${productionRuleIndex}]`);

    showSolutionButton.on('click',function () {
        clearGraph(productionRuleIndex);
        showSolution(productionRuleIndex, grammar)
        recenterIfGraphOutOfFrame(localDependencyGraphs[productionRuleIndex]);
    });
}

function showAllSolutions(grammar) {

    for (let i = 0; i < localDependencyGraphs.length; i++) {
        const graph = localDependencyGraphs[i];

        showSolution(i, grammar);
        recenterIfGraphOutOfFrame(graph);
    }
}

function showSolution(graphIndex, grammar) {
    drawDependencyGraph(localDependencyGraphs[graphIndex], grammar, grammar.productionRules[graphIndex], GRAPH_TYPE.localDependency);
}


/* Errors */
function setFunctionForShowErrorsButton(productionRuleIndex) {
    $(`.showGraphErrorsBtn[data-index=${productionRuleIndex}]`).on('click',() => toggleGraphErrorsVisibility(productionRuleIndex));
}


function showGraphCorrectIcon(productionRuleIndex) {
    $(`.dependencyGraphCorrectIcon[data-index=${productionRuleIndex}]`).show();
}

export function hideGraphCorrectIcon(productionRuleIndex) {
    $(`.dependencyGraphCorrectIcon[data-index=${productionRuleIndex}]`).hide();
}

export function resetErrors(graphIndex) {
    clearErrorHighlighting(graphIndex);
    clearAndHideGraphErrorsList(graphIndex);
    hideGraphErrorsButton(graphIndex);
}

function clearErrorHighlighting(graphIndex) {
    localDependencyGraphs[graphIndex].removeAllHighlighting();
}

export function clearAndHideGraphErrorsList(graphIndex) {
    $(`.graphErrors[data-index=${graphIndex}]`).hide();
    $(`.graphErrorMessages[data-index=${graphIndex}]`).empty();
}

function addGraphErrors(graphIndex, graphErrors) {

    const graphErrorMessagesList = $(`.graphErrorMessages[data-index=${graphIndex}]`);

    for (const error of graphErrors) {
        graphErrorMessagesList.append(`<li>${error}</li>`);
    }
}

function showEitherErrorButtonOrCorrectIcon(graphIndex, graphErrors) {

    if (arrayIsEmpty(graphErrors)) {
        showGraphCorrectIcon(graphIndex);
        graphCorrectnessObserver.setGraphAsCorrect(graphIndex);
    } else {
        showToggleGraphErrorsBtn(graphIndex);
    }
}

function hideGraphErrorsButton(graphIndex) {
    $(`.showGraphErrorsBtn[data-index=${graphIndex}]`).hide();
}

function showToggleGraphErrorsBtn(graphIndex) {
    $(`.showGraphErrorsBtn[data-index=${graphIndex}]`).show();
}

function toggleGraphErrorsVisibility(graphIndex) {
    $(`.graphErrors[data-index=${graphIndex}]`).fadeToggle(100);
}


/* Remove graph */
export function removeAllGraphs() {
    for (let i = 0; i < localDependencyGraphs.length; i++) {
        removeGraph(i);
    }
}

function removeGraph(graphIndex) {
    clearGraph(graphIndex);
    localDependencyGraphs[graphIndex].paper.remove();
}


/* Delete exercise */
export function deleteLocalDependencyExercise() {
    hideExercise();
    removeAllGraphs();
    deleteAllGraphCards();
    removeEventHandlersFromGraphCardButtons();
    removeEventHandlersFromButtonsAll();
    emptyLocalDependencyGraphsArray();
}

function hideExercise() {
    $('#dependenciesExercise').hide();
}

function deleteAllGraphCards() {
    // Keep the template = do not delete the first card.
    $('.dependenciesGraphCard').not(':first').remove();
}

function removeEventHandlersFromGraphCardButtons() {
    $('.dependenciesCheckBtn').off('click');
    $('.dependenciesClearBtn').off('click');
    $('.dependenciesDrawBtn').off('click');
    $('.dependenciesSolutionBtn').off('click');
    $('.dependenciesRecenterBtn').off('click');
    $('.showGraphErrorsBtn').off('click');
}

function removeEventHandlersFromButtonsAll() {
    $('#dependenciesCheckAllBtn').off('click');
    $('#dependenciesDrawAllBtn').off('click');
    $('#dependenciesAllSolutionsBtn').off('click');
}

function emptyLocalDependencyGraphsArray() {
    emptyArray(localDependencyGraphs);
}


/* Graph correctness observer */
export class GraphCorrectnessObserver {
    #grammar;
    #graphsArray; // A true value stands for a correct graph.
    #acyclicityNotYetEnabled = true;

    constructor(grammar, numberOfGraphs) {
        this.#grammar = grammar;
        this.#graphsArray = new Array(numberOfGraphs).fill(false);
    }

    setGraphAsCorrect(graphIndex) {
        if (this.#acyclicityNotYetEnabled) {

            this.#graphsArray[graphIndex] = true;

            if (this.allGraphsAreCorrect()) {
                this.#acyclicityNotYetEnabled = false;

                enableStrongAcyclicityExercise();
                addIteration(this.#grammar, 0);
            }
        }
    }

    allGraphsAreCorrect() {
        return this.#graphsArray.every(Boolean);
    }
}