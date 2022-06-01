import {applyGrammar, editGrammar} from './grammar/grammarInput.js';
import {clearAllGraphs} from './localDependency/exercise.js';

export let grammarInputField;

$(function () {

    // Check if it is a mobile device and show a warning.
    if (window.matchMedia("(hover: none)").matches) {
        // hover unavailable
        $('#mobileWarning').css('display', 'flex');
    }

    // Set function for the 'Apply' button.
    $('#applyGrammarButton').on('click',function () {
        applyGrammar(grammarInputField.getDoc().getValue());
    });


    // Set function for the 'Edit' button.
    $('#editGrammarButton').on('click', function () {
        editGrammar();
    });


    // Set function for the 'Clear all' button in the exercise 'Local dependency graphs'.
    //
    // It can be set just once at the very beginning, because it does not depend on any parameter.
    // And it can be done right on document load, because the button is unique and is already in the html, just hidden.
    $('#dependenciesClearAllBtn').on('click',function () {
        clearAllGraphs();
    });


    // Replace the textarea for the Attribute Grammar with a CodeMirror instance, in order to provide line numbering.
    grammarInputField = CodeMirror(document.getElementById('grammarInputWrapper'), {
        lineNumbers: true,
        lineWrapping: true,
        value: 'S -> L : h[0] = h[1]; i[1] = j[1]; j[0] = j[1]; k[1] = h[1]; i[0] = 0; k[0] = 0\n' +
            'L -> a : j[0] = k[0]; h[0] = 0; i[0] = 0\n' +
            'L -> b : h[0] = i[0]; j[0] = 0; k[0] = 0'
    });


    // Initialise the bootstrap tooltips.
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
});