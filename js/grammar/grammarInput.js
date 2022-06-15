import {
    arrayIsEmpty,
    arraysHaveDifferentLengths,
    disable,
    enable,
    ERROR,
    getLastArrayIndex,
    textIsEmpty
} from "../utils.js";
import {defineJointAttrsysObjects} from "../joint/attrsys.js";
import {
    createLocalDependencyExercise,
    deleteLocalDependencyExercise,
    showLocalDependencyExercise
} from "../localDependency/exercise.js";
import {
    createStrongAcyclicityExercise,
    deleteStrongAcyclicityExercise,
    showStrongAcyclicityExercise
} from "../strongAcyclicity/exercise.js";
import {Grammar} from "./grammar.js";


export class GrammarInput {
    #attributeGrammarsURL = '../attribute_grammars.json';
    #defaultGrammarTitle = 'TUM Compiler Construction I - Lecture slides example';
    #defaultGrammarProductionRules = [
        'S -> L : h[0] = h[1]; i[1] = j[1]; j[0] = j[1]; k[1] = h[1]; i[0] = 0; k[0] = 0',
        'L -> a : j[0] = k[0]; h[0] = 0; i[0] = 0',
        'L -> b : h[0] = i[0]; j[0] = 0; k[0] = 0'];
    #codeMirrorInput;
    #currentlyDisplayedGrammarIsLoadedGrammar = false;


    constructor() {
        this.#instantiateCodeMirror();

        this.#addEventToRemoveTitleOnChange();

        this.#setFunctionForApplyButton();
        this.#setFunctionForEditButton();

        this.#loadGrammarsFromFile()
            .then(attributeGrammars => {

                checkJSONFormat(attributeGrammars);

                this.#fillGrammarSelectMenu(attributeGrammars);

                // It has been checked, that the json array is not empty, so the first grammar is definitely present.
                this.#showGrammarInTextArea(attributeGrammars, 0);

            })
            .catch(error => this.#setGrammarInCaseOfError(error));
    }


    #instantiateCodeMirror() {
        // Replace the textarea for the Attribute Grammar with a CodeMirror instance, in order to provide line numbering.
        this.#codeMirrorInput = CodeMirror(document.getElementById('grammarInputWrapper'), {
            lineNumbers: true,
            lineWrapping: true,
        });
    }

    #addEventToRemoveTitleOnChange() {
        CodeMirror.on(this.#codeMirrorInput, 'change', (codeMirrorInstance, changeObj) => {

            if (this.#currentlyDisplayedGrammarIsLoadedGrammar) {

                const removedTextArray = changeObj.removed;
                const addedTextArray = changeObj.text;

                // If anything, apart from whitespace, has been added or removed,
                // the grammar has become different from the one, which was loaded.
                if (meaningfulChangesHaveBeenMade(addedTextArray, removedTextArray)) {
                    hideGrammarTitle();
                    this.#currentlyDisplayedGrammarIsLoadedGrammar = false;
                }
            }
        });

        function meaningfulChangesHaveBeenMade(addedTextArray, removedTextArray) {

            if (arraysHaveDifferentLengths(addedTextArray, removedTextArray)) {
                // If at least in one of the texts has some character other than a whitespace, the change was meaningful.
                return meaningfulCharactersChanged(addedTextArray) || meaningfulCharactersChanged(removedTextArray);
            }

            // The arrays have the same length.
            // If the texts are pairwise unequal, then some text has been replaced by something different
            // and thus there was a meaningful change.
            // The only exception, is when both texts contain only whitespaces, but a different number of them: '' vs '  '.
            for (let i = 0; i < addedTextArray.length; i++) {

                if (addedTextArray[i] !== removedTextArray[i]
                    && !(textIsEmpty(addedTextArray[i]) && textIsEmpty(removedTextArray[i]))) {
                    return true;
                }
            }

            return false;
        }

        function meaningfulCharactersChanged(textArray) {
            for (const text of textArray) {
                if (!textIsEmpty(text)) {
                    return true;
                }
            }
            return false;
        }
    }

    #setFunctionForApplyButton() {
        $('#applyGrammarButton').on('click', () => {
            const currentTextInGrammarInput = this.#codeMirrorInput.getDoc().getValue();
            applyGrammar(currentTextInGrammarInput, this.#codeMirrorInput);
        });
    }

    #setFunctionForEditButton() {
        $('#editGrammarButton').on('click', () => {
            editGrammar(this.#codeMirrorInput);
        });
    }

    async #loadGrammarsFromFile() {
        const request = new Request(this.#attributeGrammarsURL);

        return await fetch(request)
            .then((response) => {

                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('HTTP error');
                }
            });
    }


    #fillGrammarSelectMenu(attributeGrammars) {
        for (let index = 0; index < attributeGrammars.length; index++) {

            const grammar = attributeGrammars[index];

            checkJSONGrammarFormat(grammar);

            addMenuItem(grammar, index);

            this.#assignActionToMenuItem(attributeGrammars, index);
        }

        function checkJSONGrammarFormat(grammar) {
            if (grammar.title === undefined) {
                throw new SyntaxError('Grammar title not found.');
            }

            if (grammar.productionRules === undefined) {
                throw new SyntaxError('Grammar production rules not found.');
            }

            if (!(grammar.productionRules instanceof Array)) {
                throw new SyntaxError('The production rules of a grammar must be in an array.');
            }
        }

        function addMenuItem(grammar, index) {
            const newItem = `<li><button class="grammarSelectListItem dropdown-item" type="button" data-index="${index}">${grammar.title}</button></li>`;
            $('#grammarSelectList').append(newItem);
        }
    }

    #assignActionToMenuItem(attributeGrammars, index) {
        $(`.grammarSelectListItem[data-index=${index}]`).on('click', () => {
            this.#showGrammarInTextArea(attributeGrammars, index);
        })
    }


    #showGrammarInTextArea(attributeGrammars, index) {

        // Temporarily set the displayed grammar as not loaded. Otherwise, the loading and displaying of the new grammar
        // would be detected by the text area and be interpreted as a meaningful change,
        // which would immediately hide the grammar title.
        this.#currentlyDisplayedGrammarIsLoadedGrammar = false;

        const title = attributeGrammars[index].title;
        const productionRules = attributeGrammars[index].productionRules;

        setGrammarTitle(title);
        showGrammarTitle();

        this.#setProductionRules(productionRules);

        this.#currentlyDisplayedGrammarIsLoadedGrammar = true;
    }

    #setProductionRules(productionRules) {
        let grammarText = '';

        for (let i = 0; i < productionRules.length; i++) {
            grammarText += productionRules[i];

            if (i < getLastArrayIndex(productionRules)) grammarText += '\n';
        }

        this.#codeMirrorInput.setValue(grammarText);
    }

    #setGrammarInCaseOfError(error) {
        this.#showDefaultGrammar();

        if (error instanceof SyntaxError) {
            addErrorMenuItem('ERROR! The JSON file is wrongly formatted.');

        } else if (error.message === 'JSON Array is empty.') {
            addErrorMenuItem('No attribute grammars have been specified.');

        } else {
            addErrorMenuItem('ERROR! The JSON file could not be loaded.');
        }
    }

    #showDefaultGrammar() {
        setGrammarTitle(this.#defaultGrammarTitle);
        showGrammarTitle();
        this.#setProductionRules(this.#defaultGrammarProductionRules);
    }
}


function checkJSONFormat(jsonObject) {
    if (!(jsonObject instanceof Array)) {
        throw new SyntaxError('JSON must consist of an array only.');
    }

    if (arrayIsEmpty(jsonObject)) {
        throw new Error('JSON Array is empty.')
    }
}

function addErrorMenuItem(text) {
    const newItem = `<li><button class="dropdown-item" type="button" disabled>${text}</button></li>`;
    $('#grammarSelectList').append(newItem);
}

function setGrammarTitle(title) {
    $('#grammarTitleText').html(title);
}

function showGrammarTitle() {
    $('#grammarTitle').removeClass('hide');
    document.documentElement.style.setProperty('--grammarTitleHeight', '1.8rem');
}

function hideGrammarTitle() {
    $('#grammarTitle').addClass('hide');
    document.documentElement.style.setProperty('--grammarTitleHeight', '0px');
}


function applyGrammar(grammarText, codeMirror) {

    clearGrammarErrorMessages();
    let grammarErrors = [];

    const grammarParsingResult = parseGrammar(grammarText, grammarErrors);
    if (grammarParsingResult === ERROR) return;

    const grammar = grammarParsingResult;

    defineJointAttrsysObjects(grammar);

    disableApplyButton();
    enableEditButton();
    disableLoadGrammarSelectMenu();
    disableGrammarInput(codeMirror);

    createLocalDependencyExercise(grammar);
    showLocalDependencyExercise();

    createStrongAcyclicityExercise(grammar);
    showStrongAcyclicityExercise();
}


function editGrammar(codeMirror) {
    enableApplyButton();
    disableEditButton();
    enableLoadGrammarSelectMenu();
    enableGrammarInput(codeMirror);

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

function enableLoadGrammarSelectMenu() {
    enable($('#grammarSelect'));
}

function disableLoadGrammarSelectMenu() {
    disable($('#grammarSelect'));
}

function enableGrammarInput(codeMirror) {
    // Set input as editable.
    codeMirror.setOption('readOnly', false);

    // Change the text colour back to black.
    codeMirror.getDoc().eachLine((line) => {
        codeMirror.getDoc().removeLineClass(line, 'wrap', 'disabledText')
    });
}

function disableGrammarInput(codeMirror) {
    // Set input as non-editable.
    codeMirror.setOption('readOnly', true);

    // Change the text colour to light grey.
    codeMirror.getDoc().eachLine((line) => {
        codeMirror.getDoc().addLineClass(line, 'wrap', 'disabledText')
    });
}