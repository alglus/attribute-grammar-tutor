import {disable, enable, ERROR, textIsEmpty} from './utils.js';
import {Grammar} from './grammar.js';
import {
    createLocalDependencyExercise,
    deleteLocalDependencyExercise,
    showLocalDependencyExercise,
} from './localDependencyExercise.js';
import {grammarInput} from "./init.js";
import {
    createStrongAcyclicityExercise,
    deleteStrongAcyclicityExercise,
    showStrongAcyclicityExercise
} from "./strongAcyclicityExercise.js";
import {defineJointAttrsysObjects} from "./joint.attrsys.js";


export function applyGrammar(grammarText) {

    clearGrammarErrorMessages();
    let grammarErrors = [];

    const grammarParsingResult = parseGrammar(grammarText, grammarErrors);
    if (grammarParsingResult === ERROR) return;

    const grammar = grammarParsingResult;

    defineJointAttrsysObjects(grammar);

    disableApplyButton();
    enableEditButton();
    disableGrammarInput();

    createLocalDependencyExercise(grammar);
    showLocalDependencyExercise();

    createStrongAcyclicityExercise(grammar);
    showStrongAcyclicityExercise();
}


export function editGrammar() {
    enableApplyButton();
    disableEditButton();
    enableGrammarInput();

    deleteLocalDependencyExercise();
    deleteStrongAcyclicityExercise();
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


function enableApplyButton() {
    enable($('#applyGrammarButton'));
}

function disableApplyButton() {
    disable($('#applyGrammarButton'));
}

function enableEditButton() {
    enable($('#editGrammarButton'));
}

function disableEditButton() {
    disable($('#editGrammarButton'));
}

function enableGrammarInput() {
    // Set input as editable.
    grammarInput.setOption('readOnly', false);

    // Change the text colour back to black.
    grammarInput.getDoc().eachLine((line) => {
        grammarInput.getDoc().removeLineClass(line, 'wrap', 'disabledText')
    });
}

function disableGrammarInput() {
    // Set input as non-editable.
    grammarInput.setOption('readOnly', true);

    // Change the text colour to light grey.
    grammarInput.getDoc().eachLine((line) => {
        grammarInput.getDoc().addLineClass(line, 'wrap', 'disabledText')
    });
}