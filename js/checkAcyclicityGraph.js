import {ERROR, removeAllWhiteSpaces} from "./utils.js";
import {
    addTooltip,
    highlightRadioAsError,
    highlightTextAsError,
    highlightTextInputAsError
} from "./strongAcyclicityExercise.js";


export function checkIterationStable(grammar, actualAnswer, iterationIndex){

    if (actualAnswer === undefined) {
        highlightRadioAsError($(`#stableYes_${iterationIndex}`));
        highlightRadioAsError($(`#stableNo_${iterationIndex}`));
        highlightTextAsError($(`label[for=stableYes_${iterationIndex}]`));
        highlightTextAsError($(`label[for=stableNo_${iterationIndex}]`));
        return ERROR;
    }

    const expectedAnswer = grammar.iterationStable[iterationIndex];

    if (actualAnswer !== expectedAnswer) {
        const questionSelector = $(`.acyclicityIterationFooter[data-iteration=${iterationIndex}] p`);
        highlightTextAsError(questionSelector);
        addTooltip(questionSelector, 'An iteration is considered stable, if there were no changes to the previous one.');
        return ERROR;
    }
}


export function checkTransitiveRelations(grammar, actualRelationsAnswer, nonterminalIndex, iterationIndex) {

    const expectedRelations = Array.from(grammar.nonterminals.getAt(nonterminalIndex).iterations[iterationIndex].transitiveRelations.values())
        .map(dependency => dependency.toRelationString())
        .sort()
        .toString();

    const relationMatcher = /.*?(\(.+?\)).*?/g;
    const relationsMatchResult = actualRelationsAnswer.matchAll(relationMatcher);

    const actualRelations = Array.from(relationsMatchResult)
        .map(matchItemArray => matchItemArray[1]) // The first matched group is the second element in the match array.
        .map(relation => removeAllWhiteSpaces(relation))
        .sort()
        .toString();

    if (actualRelations !== expectedRelations) {
        const transitiveRelationsLabelSelector = $(`label[for=transitiveRelation_${nonterminalIndex}_${iterationIndex}`);
        highlightTextAsError(transitiveRelationsLabelSelector);
        addTooltip(transitiveRelationsLabelSelector, 'Please make sure that you follow the required format: (from, to), (from, to)….' +
            ' Also remember, that R() is a union of the transitive relations of all production rules of that non-terminal.');

        const transitiveRelationsInputSelector = $(`#transitiveRelation_${nonterminalIndex}_${iterationIndex}`);
        highlightTextInputAsError(transitiveRelationsInputSelector);
        return ERROR;
    }
}


export function checkCycleFound(grammar, actualAnswer, nonterminalIndex, productionRuleIndex, iterationIndex) {

    if (actualAnswer === undefined) {
        highlightRadioAsError($(`#cycleFoundYes_${nonterminalIndex}_${productionRuleIndex}_${iterationIndex}`));
        highlightRadioAsError($(`#cycleFoundNo_${nonterminalIndex}_${productionRuleIndex}_${iterationIndex}`));
        highlightTextAsError($(`label[for=cycleFoundYes_${nonterminalIndex}_${productionRuleIndex}_${iterationIndex}]`));
        highlightTextAsError($(`label[for=cycleFoundNo_${nonterminalIndex}_${productionRuleIndex}_${iterationIndex}]`));
        return ERROR;
    }

    const expectedAnswer = grammar.nonterminals.getAt(nonterminalIndex).productionRules[productionRuleIndex].iterations[iterationIndex].cycleFound;

    if (actualAnswer !== expectedAnswer) {
        const questionSelector = $(`.acyclicityCycleFound[data-nonterminal=${nonterminalIndex}][data-productionRule=${productionRuleIndex}][data-iteration=${iterationIndex}] p`);
        highlightTextAsError(questionSelector);
        addTooltip(questionSelector, 'Try building for every attribute all possible transitive relations and see, whether a cycle is formed.');
        return ERROR;
    }
}

// TODO: WIP
export function checkAcyclicityGraph(grammar, graph, nonterminalIndex, productionRuleIndex, iterationIndex) {

    const expectedRedecoratedRelations = new Map(grammar.nonterminals.getAt(nonterminalIndex).productionRules[productionRuleIndex].iterations[iterationIndex].redecoratedRelations);

    // The graph is generated automatically, so the solution is correct and there is definitely just one root.
    const graphRoot = graph.getRoots()[0];

    const rootChildren = graph.getChildrenSortedByX(graphRoot);

    for (const symbolNode of rootChildren) {

        const attributeNodes = symbolNode.getAttributeNodes();


    }
    if (0 === 1) return ERROR; // TODO: just to silence the IDE
}