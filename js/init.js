import {applyGrammar, editGrammar} from './grammarButtons.js';
import {clearAllGraphs} from './dependenciesGraphButtons.js';


$(document).ready(function () {

    // Set function for the 'Apply' button.
    $('#applyGrammarButton').click(function () {
        applyGrammar($('#grammarText').val());
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
});