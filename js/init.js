import {applyGrammar, editGrammar} from './grammarButtons.js';
import {clearAllGraphs} from './dependenciesGraphButtons.js';

export let grammarInput;

$(document).ready(function () {

    // Set function for the 'Apply' button.
    $('#applyGrammarButton').click(function () {
        applyGrammar(grammarInput.getDoc().getValue());
    });

    // Set function for the 'Edit' button.
    $('#editGrammarButton').click(function () {
        editGrammar();
    });

    // Set function for the 'Reset all' button in the exercise 'Local dependency graphs'.
    //
    // It can be set just once at the very beginning, because it does not depend on any parameter.
    // And it can be done right on document load, because the button is unique and is already in the html, just hidden.
    $('#dependenciesResetAllBtn').click(function () {
        clearAllGraphs();
    });

    // Replace the textarea for the Attribute Grammar with a CodeMirror instance, in order to provide line numbering.
    grammarInput = CodeMirror(document.getElementById('grammarInputWrapper'), {
        lineNumbers: true,
        lineWrapping: true,
        value: 'S -> A   : z[0] = z[1]; c[1] = 0\n' +
            'A -> s B : a[2] = y[2]; b[2] = c[0]; z[0] = x[2]\n' +
            'A -> t B : a[2] = c[0]; b[2] = x[2]; z[0] = y[2]\n' +
            'B -> u   : x[0] = a[0]; y[0] = b[0]\n' +
            'B -> v   : y[0] = x[0]; x[0] = 0'
    });
});