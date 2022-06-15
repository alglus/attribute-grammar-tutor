import {clearAllGraphs} from './localDependency/exercise.js';
import {GrammarInput} from "./grammar/grammarInput.js";

$(function () {

    // Initialise the grammar input and load the attribute grammars.
    new GrammarInput();


    // Check if it is a mobile device and show a warning.
    if (window.matchMedia("(hover: none)").matches) {
        // hover unavailable
        $('#mobileWarning').css('display', 'flex');
    }


    // Set the function for the 'Clear all' button in the exercise 'Local dependency graphs'.
    //
    // It can be set just once at the very beginning, because it does not depend on any parameter.
    // And it can be done right on document load, because the button is unique and is already in the html, just hidden.
    $('#dependenciesClearAllBtn').on('click',function () {
        clearAllGraphs();
    });


    // Initialise the bootstrap tooltips.
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
});