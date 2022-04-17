import {ERROR, textIsEmpty} from './utils.js';
import {Grammar} from './grammar.js';
import {createDependenciesGraphs, emptyDependenciesGraphsArray, removeAllGraphs} from './dependenciesGraphButtons.js';


export function applyGrammar(grammarText) {

    clearGrammarErrorMessages();
    let grammarErrors = [];

    const grammarParsingResult = parseGrammar(grammarText, grammarErrors);
    if (grammarParsingResult === ERROR) return;

    const grammar = grammarParsingResult;

    enableDisableGrammarElementsAfterApplyingGrammar();

    createDependenciesGraphs(grammar);

    showDependenciesExercise();
}


export function editGrammar() {
    enableDisableGrammarElementsInOrderToEditGrammar();

    hideDependenciesExerciseAndDeleteDependenciesGraphClones();

    emptyDependenciesGraphsArray();
}


function parseGrammar(grammarText) {
    const grammarErrors = [];

    if (textIsEmpty(grammarText)) {
        grammarErrors.push('The attribute grammar field is empty.');
        displayGrammarErrorMessages(grammarErrors);
        return ERROR;
    }

    const grammar = new Grammar(grammarText);

    if (grammar.errors.length > 0) {
        displayGrammarErrorMessages(grammar.errors);
        return ERROR;
    }

    return grammar;
}


function displayGrammarErrorMessages(errors) {
    const grammarErrorMessagesList = $('#grammarErrorMessages');

    for (const error of errors) {
        grammarErrorMessagesList.append(`<li class="list-group-item list-group-item-danger">${error}</li>`);
    }

    grammarErrorMessagesList.show();
}


function clearGrammarErrorMessages() {
    const grammarErrorMessagesList = $('#grammarErrorMessages');
    grammarErrorMessagesList.empty();
    grammarErrorMessagesList.hide();
}


function enableDisableGrammarElementsAfterApplyingGrammar() {
    $('#grammarText').prop('disabled', true);
    $('#applyGrammarButton').prop('disabled', true);
    $('#editGrammarButton').prop('disabled', false);
}


function enableDisableGrammarElementsInOrderToEditGrammar() {
    $('#grammarText').prop('disabled', false);
    $('#applyGrammarButton').prop('disabled', false);
    $('#editGrammarButton').prop('disabled', true);
}


function showDependenciesExercise() {
    $('#dependenciesExercise').slideDown('fast');

    // If the dependencies exercise has been collapsed before clicking the edit button, then it will stay collapsed
    // after pressing ApplyGrammar again. In order to prevent this, we check if the exercise was collapsed by searching
    // for the corresponding class and then 'manually clicking' that button to open the accordion.
    $('#dependenciesCollapseBtn.collapsed').click();
}


function hideDependenciesExerciseAndDeleteDependenciesGraphClones() {
    $('#dependenciesExercise').hide();
    removeAllGraphs();
    $('.dependenciesGraphCard').not(':first').remove();

    $('.dependenciesCheckBtn').off('click');
    $('.dependenciesResetBtn').off('click');
    $('.dependenciesDrawBtn').off('click');
    $('.dependenciesSolutionBtn').off('click');
    $('.dependenciesRecenterBtn').off('click');
    $('.showGraphErrorsBtn').off('click');

    $('#dependenciesCheckAllBtn').off('click');
    $('#dependenciesDrawAllBtn').off('click');
    $('#dependenciesAllSolutionsBtn').off('click');
}
