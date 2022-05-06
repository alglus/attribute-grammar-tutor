import {arrayIsEmpty, ERROR, removeAllWhiteSpaces, setIsEmpty, symbolIsRoot} from "./utils.js";
import {
    addHTMLTooltip,
    addTooltip,
    highlightRadioAsError,
    highlightTextAsError,
    highlightTextInputAsError
} from "./strongAcyclicityExercise.js";


export function checkIterationStable(grammar, actualAnswer, iterationIndex) {

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


export function checkAcyclicityGraph(grammar, graphObject, nonterminalIndex, productionRuleIndex, iterationIndex) {

    const jointGraph = graphObject.graph;
    const errorMessages = new Set; // To avoid duplicate error messages.

    // Create copies of the original map, in order to delete relations, as they being are found.
    // This way we can at the end tell, which relations have not been drawn.
    const expectedRedecoratedRelations = new Map(grammar.nonterminals.getAt(nonterminalIndex).productionRules[productionRuleIndex].iterations[iterationIndex].redecoratedRelations);
    const expectedRootProjections = new Map(grammar.nonterminals.getAt(nonterminalIndex).productionRules[productionRuleIndex].iterations[iterationIndex].rootProjections);

    // The graph is generated automatically, so the solution is correct and there is definitely just one root.
    const graphRoot = graphObject.getRoots()[0];
    const rootChildren = graphObject.getChildrenSortedByX(graphRoot);
    const allSymbolNodes = [graphRoot, ...rootChildren];

    for (const symbolNode of allSymbolNodes) {

        const symbolIndex = symbolNode.getIndex();
        const attributeNodes = symbolNode.getAttributeNodes();

        for (const attributeNode of attributeNodes) {

            const attributeName = attributeNode.getName();

            const outgoingLinks = jointGraph.getConnectedLinks(attributeNode, {outbound: true});
            const outgoingRedecoratedLinks = outgoingLinks.filter(l => l.get('type') === 'attrsys.RedecoratedLink');
            const outgoingProjectedLinks = outgoingLinks.filter(l => l.get('type') === 'attrsys.ProjectedLink');


            /* Redecorated links */
            for (const outgoingRedecoratedLink of outgoingRedecoratedLinks) {

                if (symbolIsRoot(symbolIndex)) {
                    graphObject.highlightElement(outgoingRedecoratedLink);
                    errorMessages.add('No redecoration is done on the root node.');
                    continue;
                }

                const targetAttributeId = outgoingRedecoratedLink.get('target').id;
                const targetAttributeNode = jointGraph.getCell(targetAttributeId);
                const targetAttributeName = targetAttributeNode.getName();
                const targetSymbolIndex = targetAttributeNode.getSymbolNode().getIndex();

                if (symbolIndex !== targetSymbolIndex) {
                    graphObject.highlightElement(outgoingRedecoratedLink);
                    errorMessages.add('Redecorated relations are only possible between attributes of one symbol.');
                    continue;
                }

                const redecoratedRelationHash = `${symbolIndex}${attributeName}${targetSymbolIndex}${targetAttributeName}`;

                if (expectedRedecoratedRelations.has(redecoratedRelationHash)) {

                    // A correct relation has been found, so we can delete it from the expected list.
                    expectedRedecoratedRelations.delete(redecoratedRelationHash);
                } else {

                    graphObject.highlightElement(outgoingRedecoratedLink);
                    errorMessages.add(`The redecorated relation from [${symbolIndex}].${attributeName} to [${targetSymbolIndex}].${targetAttributeName} is wrong.`);
                }
            }


            /* Root projections */
            for (const outgoingProjectedLink of outgoingProjectedLinks) {

                if (!symbolIsRoot(symbolIndex)) {
                    graphObject.highlightElement(outgoingProjectedLink);
                    errorMessages.add('A root projection can only happen on the root node.');
                    continue;
                }

                const targetAttributeId = outgoingProjectedLink.get('target').id;
                const targetAttributeNode = jointGraph.getCell(targetAttributeId);
                const targetAttributeName = targetAttributeNode.getName();
                const targetSymbolIndex = targetAttributeNode.getSymbolNode().getIndex();

                if (symbolIndex !== targetSymbolIndex) {
                    graphObject.highlightElement(outgoingProjectedLink);
                    errorMessages.add('Root projections are relations only between attributes of the root node.');
                    continue;
                }

                const rootProjectionHash = `${symbolIndex}${attributeName}${targetSymbolIndex}${targetAttributeName}`;

                if (expectedRootProjections.has(rootProjectionHash)) {

                    // A correct relation has been found, so we can delete it from the expected list.
                    expectedRootProjections.delete(rootProjectionHash);
                } else {

                    graphObject.highlightElement(outgoingProjectedLink);
                    errorMessages.add(`The root projection from [${symbolIndex}].${attributeName} to [${targetSymbolIndex}].${targetAttributeName} is wrong.`);
                }
            }
        }
    }

    // Missing redecorated relations.
    for (const expectedRelation of expectedRedecoratedRelations.values()) {
        errorMessages.add(`A redecorated relation from [${expectedRelation.fromSymbolIndex}].${expectedRelation.fromAttributeName}` +
            ` to [${expectedRelation.toSymbolIndex}].${expectedRelation.toAttributeName} is missing.`);
    }

    // Missing root projections.
    for (const expectedRelation of expectedRootProjections.values()) {
        errorMessages.add(`A root projection from [${expectedRelation.fromSymbolIndex}].${expectedRelation.fromAttributeName}` +
            ` to [${expectedRelation.toSymbolIndex}].${expectedRelation.toAttributeName} is missing.`);
    }

    if (!setIsEmpty(errorMessages)) {
        const warningIcon = $(`.acyclicityCycleFound[data-nonterminal=${nonterminalIndex}][data-productionRule=${productionRuleIndex}][data-iteration=${iterationIndex}] > svg.acyclicityWarningIcon`);
        addHTMLTooltip(warningIcon, errorMessages);
        warningIcon.show();
        return ERROR;
    }
}
