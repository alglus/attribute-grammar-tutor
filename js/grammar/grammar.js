import {
    getLastArrayItem,
    parameterHasBeenSpecified,
    textIsEmpty,
    splitIntoRows,
    splitIntoWords,
    replaceMultipleWhiteSpacesByOne,
    ERROR,
    containsAny,
    IndexedMap,
    isInArray, getOrCreateArray, emptyArray, arrayIsEmpty, mapKeysAreEqual, getPenultimateArrayItem, symbolIsRoot
} from '../utils.js';


/**
 * Grammar class
 *
 * Created once, after clicking on the button 'Apply'. The constructor parses the Attribute Grammar provided by the
 * user. If any errors are encountered during the parsing, it is aborted and relevant errors are displayed.
 *
 * It stores all necessary variables and provides useful methods, to later construct the exercises.
 */
export class Grammar {

    #FORBIDDEN_SYMBOLS = ['[', ']', ';', '='];
    #allSymbolNames = new Set();
    #allTerminalNames = new Set();
    #allNonterminalNames = new Set();
    #allAttributeNames = new Set();
    #attributesBySymbol = new Map();
    #productionRules = [];
    #errors = [];
    #numberOfElementsPerRule = [];
    #strongAcyclicity = new StrongAcyclicity();


    constructor(grammarText) {

        const grammarTextRows = splitIntoRows(replaceMultipleWhiteSpacesByOne(grammarText));

        for (let i = 0; i < grammarTextRows.length; i++) {

            const row = grammarTextRows[i];

            if (textIsEmpty(row)) continue;

            const rowHalves = row.split(':');

            if (rowHalves.length > 2) {
                this.#addError(i, row, "There can only be one separator ':' in a row.");
            }

            const productionRuleText = rowHalves[0];
            const parsingResult = this.#parseProductionRule(i, productionRuleText);
            if (parsingResult === ERROR) continue;

            // A production rule must not necessarily have some attribute attached.
            // Thus, we only parse the attributes, if there are any.
            if (rowHalves.length === 2) {
                const attributesText = rowHalves[1];
                this.#parseAttributes(i, attributesText);
            }
        }

        this.#mergeMissingAttributesAndSort();

        this.#defineAttributeIndexesInDependenciesAndCountElements();

        this.#computeTerminals();

        this.#computeStrongAcyclicityIterations();
    }


    #parseProductionRule(lineNumber, productionRuleText) {

        const productionRule = new ProductionRule();

        const productionRuleHalves = productionRuleText.split('->');
        if (productionRuleHalves.length !== 2) {
            this.#addError(lineNumber, productionRuleText, "The production rule must be separated by one arrow '->'.");
            return ERROR;
        }

        const parsingLeftSideResult = this.#parseProductionRuleLeftSide(lineNumber, productionRuleText, productionRuleHalves[0], productionRule);
        const parsingRightSideResult = this.#parseProductionRuleRightSide(lineNumber, productionRuleText, productionRuleHalves[1], productionRule);

        if (parsingLeftSideResult === ERROR || parsingRightSideResult === ERROR) return ERROR;

        this.#productionRules.push(productionRule);
        this.#addToNonterminals(productionRule);
    }


    #parseProductionRuleLeftSide(lineNumber, productionRuleText, productionRuleLeftText, productionRule) {

        const productionLeftSymbols = splitIntoWords(productionRuleLeftText);
        const leftNonterminal = productionLeftSymbols[0];

        if (textIsEmpty(leftNonterminal)) {
            this.#addError(lineNumber, productionRuleText, 'A non-terminal is missing on the left-hand side of the production.');
            return ERROR;
        }

        if (containsAny(leftNonterminal, this.#FORBIDDEN_SYMBOLS)) {
            this.#addError(lineNumber, leftNonterminal, `The characters '${this.#FORBIDDEN_SYMBOLS.join(' ')}' are not allowed as (non-)terminals.`);
            return ERROR;
        }

        if (productionLeftSymbols.length > 1) {
            this.#addError(lineNumber, productionRuleText, 'There may only be one non-terminal on the left-hand side of a production rule.');
            return ERROR;
        }

        productionRule.addSymbol(new Symbol(leftNonterminal));

        this.#allNonterminalNames.add(leftNonterminal);
        this.#allSymbolNames.add(leftNonterminal);

        this.#addNonterminal(leftNonterminal);
    }


    #parseProductionRuleRightSide(lineNumber, productionRuleText, productionRuleRightText, productionRule) {

        if (textIsEmpty(productionRuleRightText)) {
            // An empty production right side stands for an empty word (ε). So there are no symbols to add.
            return;
        }

        if (containsAny(productionRuleRightText, this.#FORBIDDEN_SYMBOLS)) {
            this.#addError(lineNumber, productionRuleRightText,
                `The characters '${this.#FORBIDDEN_SYMBOLS.join(' ')}' are not allowed as (non-)terminals.` +
                " Maybe you forgot the ':' as a separation between the production rule and the attribute equations?");
            return ERROR;
        }

        const productionRightSymbols = splitIntoWords(productionRuleRightText);

        for (const symbol of productionRightSymbols) {
            productionRule.addSymbol(new Symbol(symbol));
            this.#allSymbolNames.add(symbol);
        }
    }


    #addNonterminal(nonterminalName) {
        if (!this.#strongAcyclicity.nonterminals.has(nonterminalName)) {
            this.#strongAcyclicity.nonterminals.add(nonterminalName, new Nonterminal(nonterminalName));
        }
    }


    #addToNonterminals(productionRule) {

        const leftNonterminalName = productionRule.leftSide().name;

        const productionRules = getOrCreateArray(this.#strongAcyclicity.nonterminals.get(leftNonterminalName).productionRules);
        productionRules.push(productionRule);
    }


    #parseAttributes(lineNumber, attributesText) {

        const attributeEquations = attributesText.split(';');

        for (const attributeEquation of attributeEquations) {

            const equationHalves = attributeEquation.split('=');

            if (equationHalves.length === 1) {
                this.#addError(lineNumber, attributeEquation, "The attribute equation must have a '='.");
                continue;
            }
            if (equationHalves.length > 2) {
                this.#addError(lineNumber, attributeEquation, "There can only be one equals sign '=' in an equation.");
                continue;
            }

            const attributeNameAndIndexMatcher = /.*?(\w+?)\[(\d+?)].*?/g;
            const productionRule = getLastArrayItem(this.#productionRules);

            const leftAttribute = this.#parseLeftAttribute(lineNumber, equationHalves[0], attributeEquation, productionRule, attributeNameAndIndexMatcher);
            if (leftAttribute === ERROR) return;

            // We can move on without checking, whether there was a parsing error of the right attribute, as we have done for the left one.
            // This is because no further functions depend on the parsed values of the right attributes and so no runtime error can occur.
            // This way we parse as many attributes as possible, without aborting and can show more warnings to the user.
            this.#parseRightAttribute(lineNumber, equationHalves[1], attributeEquation, leftAttribute, productionRule, attributeNameAndIndexMatcher);
        }
    }


    #parseLeftAttribute(lineNumber, equationLeftHalf, attributeEquation, productionRule, attributeNameAndIndexMatcher) {

        const matchedLeftAttributes = Array.from(equationLeftHalf.matchAll(attributeNameAndIndexMatcher));

        if (!matchedLeftAttributes || matchedLeftAttributes.length === 0) {
            this.#addError(lineNumber, attributeEquation, 'The attribute on the left-hand side of the equation is wrongly formatted.');
            return ERROR;
        }

        if (matchedLeftAttributes.length > 1) {
            this.#addError(lineNumber, attributeEquation, 'There can only be one attribute on the left-hand side of the equation.');
            return ERROR;
        }

        // We checked previously, that there can only be one match, so it is safe to access index 0.
        const matchedLeftAttribute = matchedLeftAttributes[0];

        const leftAttributeName = matchedLeftAttribute[1];
        const leftAttributeSymbolIndex = Number(matchedLeftAttribute[2]);

        if (leftAttributeSymbolIndex > productionRule.maxIndex()) {
            this.#addError(lineNumber, attributeEquation, `The index in '${equationLeftHalf}' is higher than the number of symbols in the production.`);
            return ERROR;
        }

        this.#allAttributeNames.add(leftAttributeName);

        const symbolOfLeftAttribute = productionRule.symbols[leftAttributeSymbolIndex];
        const newLeftAttribute = new Attribute(leftAttributeName);

        symbolOfLeftAttribute.addAttribute(newLeftAttribute);

        this.#addToAttributesBySymbol(symbolOfLeftAttribute, newLeftAttribute);

        return {name: leftAttributeName, symbolIndex: leftAttributeSymbolIndex,};
    }


    #parseRightAttribute(lineNumber, equationRightHalf, attributeEquation, leftAttribute, productionRule, attributeNameAndIndexMatcher) {

        const matchedRightAttributes = Array.from(equationRightHalf.matchAll(attributeNameAndIndexMatcher));

        // There may be attribute equations, where an attribute has no dependency to another attribute.
        // eg. z[0] = 0. In these cases, there is no attribute on the right, and we do nothing.
        // On the other hand, there may be several attributes on the right, eg. z[0] = max(z[1], z[2]).
        // So we need to go through all the matched attributes and create a relation for each of them.
        for (const matchedRightAttribute of matchedRightAttributes) {

            const rightAttributeName = matchedRightAttribute[1];
            const rightAttributeIndex = Number(matchedRightAttribute[2]);

            if (rightAttributeIndex > productionRule.maxIndex()) {
                this.#addError(lineNumber, attributeEquation, `The index in '${equationRightHalf}' is higher than the number of symbols in the production.`);
                return;
            }

            this.#allAttributeNames.add(rightAttributeName);

            const newRightAttribute = new Attribute(rightAttributeName);
            const symbolOfRightAttribute = productionRule.symbols[rightAttributeIndex];

            const dependencyFromRightToLeftAttribute = Dependency.forUnsortedAttribute(
                rightAttributeName, rightAttributeIndex, leftAttribute.name, leftAttribute.symbolIndex);

            symbolOfRightAttribute.addAttributeAndDependency(newRightAttribute, dependencyFromRightToLeftAttribute);

            this.#addToAttributesBySymbol(symbolOfRightAttribute, newRightAttribute);
        }
    }


    #addToAttributesBySymbol(symbol, newAttribute) {

        const symbolName = symbol.name;
        const newAttributeName = newAttribute.name;

        // We create a fresh Attribute object, to prevent it having any dependencies.
        const newCleanAttribute = new Attribute(newAttributeName);

        // The attributes in the list 'attributesBySymbol' are later used to add missing attributes to a symbol.
        // This happens, when an attribute for a symbol has been declared in another production rule.
        // Therefore, these later added attributes have been identified indirectly through other production rules.
        // For this reason, we set 'indirectlyIdentified' as true.
        newCleanAttribute.indirectlyIdentified = true;

        if (this.#attributesBySymbol.has(symbolName)) {

            const existingAttributes = this.#attributesBySymbol.get(symbolName);

            if (!existingAttributes.has(newAttributeName)) {
                existingAttributes.set(newAttributeName, newCleanAttribute);
            }

        } else {

            this.#attributesBySymbol.set(symbolName, new Map([[newAttributeName, newCleanAttribute]]));
        }
    }


    /* A (non-)terminal can be present in different production rules. And in those production rules, it can be assigned
     * different attributes. However, when drawing the local dependency graph, all attributes of a (non-)terminal
     * must be drawn next to it, even if they were assigned in another production rule.
     * So, once all production rules have been parsed, this function iterates through all (non-)terminals and
     * adds any attributes, which might be missing.
     *
     * In order for these attributes to be in the same order next to all (non-)terminals, they are also sorted.
     */
    #mergeMissingAttributesAndSort() {

        for (const productionRule of this.#productionRules) {

            for (const symbol of productionRule.symbols) {

                if (this.#attributesBySymbol.has(symbol.name)) {

                    symbol.attributes.mergeIfAbsent(this.#attributesBySymbol.get(symbol.name));
                    symbol.attributes.sort();
                }
            }
        }
    }


    /* When parsing the attribute equations, we save the name of the (non-)terminals and of the attributes
     * at both ends of a dependency.
     * But we cannot at that point know the index of the attributes, because in the previous function
     * mergeMissingAttributesAndSort(), new attributes can still be added, and then they are all resorted.
     * Therefore, just now can we go through all dependencies again and find out and save the attribute-indexes.
     *
     * Because we are iterating through all (non-)terminals and all attributes in each production rule anyway,
     * we use this chance to count the number of elements (= number of nodes) per production rule.
     */
    #defineAttributeIndexesInDependenciesAndCountElements() {

        for (let i = 0; i < this.#productionRules.length; i++) {

            const productionRule = this.#productionRules[i];
            this.#numberOfElementsPerRule[i] = 0;

            for (const symbol of productionRule.symbols) {
                this.#numberOfElementsPerRule[i]++;

                for (let attributeIndex = 0; attributeIndex < symbol.attributes.length; attributeIndex++) {
                    this.#numberOfElementsPerRule[i]++;

                    const attribute = symbol.attributes.getAt(attributeIndex);

                    for (const dependency of attribute.dependencies.values()) {

                        const toSymbol = productionRule.symbols[dependency.toSymbolIndex];

                        const attributeIndexInsideSymbol = toSymbol.attributes.getIndexOf(dependency.toAttributeName);
                        if (attributeIndexInsideSymbol === ERROR) {
                            this.#addError(i, '#defineAttributeIndexesInDependencies()',
                                'An unexpected bug occurred in this function. Please report it, together with the used grammar.');
                        }

                        dependency.fromAttributeIndexInsideSymbol = attributeIndex;
                        dependency.toAttributeIndexInsideSymbol = attributeIndexInsideSymbol;
                    }
                }
            }
        }
    }


    #computeTerminals() {

        for (const symbol of this.#allSymbolNames) {

            // A nonterminal is a symbol X, for which there is a production rule, eg.: X -> Y z.
            // All non-terminals have been computed, when parsing the production rules.
            // So the terminals are all the remaining symbols, which are not contained in the nonterminal set.
            if (!this.#allNonterminalNames.has(symbol)) {
                this.#allTerminalNames.add(symbol);
            }
        }
    }


    #computeStrongAcyclicityIterations() {

        let iterationIndex = 0;
        let someNonterminalIsUnstable = true;

        while (someNonterminalIsUnstable) {

            someNonterminalIsUnstable = false;
            this.#strongAcyclicity.addIteration();

            for (const nonterminal of this.#strongAcyclicity.nonterminals.values()) {

                nonterminal.addIteration();
                const previousNonterminalIteration = nonterminal.getPreviousIteration(iterationIndex);

                for (const productionRule of nonterminal.productionRules) {

                    productionRule.addIteration();

                    this.#emptyRedecoratedDependenciesBeforeNewIteration(productionRule);

                    this.#redecorate(productionRule, iterationIndex);

                    this.#calculateTransitiveClosure(productionRule, nonterminal, iterationIndex);
                }

                if (this.#nonterminalIsUnstable(nonterminal, iterationIndex, previousNonterminalIteration)) {
                    someNonterminalIsUnstable = true;
                    this.#strongAcyclicity.setIterationUnstable(iterationIndex);
                }
            }
            iterationIndex++;
        }
    }


    /* The redecorated dependencies are stored in an array in each attribute object.
     * Before starting a new iteration, the dependencies from the previous iteration
     * need to be removed from that array, so that they do not interfere with the new iteration.
     */
    #emptyRedecoratedDependenciesBeforeNewIteration(productionRule) {

        for (const symbol of productionRule.symbols) {

            for (const attribute of symbol.attributes.values()) {

                attribute.emptyRedecoratedDependencies();
            }
        }
    }


    #redecorate(productionRule, iterationIndex) {

        for (let symbolIndex = 1; symbolIndex < productionRule.symbols.length; symbolIndex++) {

            const symbol = productionRule.symbols[symbolIndex];

            // Terminals cannot be roots of a production rule and thus cannot have transitive relations.
            // Therefore, there cannot be relations to redecorate for terminals, and so we ignore them.
            if (symbol.isNonterminal(this.#allNonterminalNames)) {

                const prevNonterminalIteration = this.#strongAcyclicity.nonterminals.get(symbol.name).getPreviousIteration(iterationIndex);

                for (const rootProjection of prevNonterminalIteration.transitiveRelations.values()) {

                    const redecoratedRelation = Dependency.redecorateTo(rootProjection, symbolIndex);

                    // Find out, what is the source attribute of the root projection.
                    const sourceAttribute = symbol.attributes.getAt(rootProjection.fromAttributeIndexInsideSymbol);

                    // We only redecorate a root projection from the previous iteration,
                    // if this relation is not already present in the production rule.
                    if (!sourceAttribute.dependencies.has(redecoratedRelation)) {

                        sourceAttribute.addRedecoratedDependency(redecoratedRelation);
                        productionRule.iterations[iterationIndex].addRedecoratedRelation(redecoratedRelation);
                    }
                }
            }
        }
    }


    #calculateTransitiveClosure(productionRule, nonterminal, iterationNumber) {

        for (let symbolIndex = 0; symbolIndex < productionRule.symbols.length; symbolIndex++) {

            const symbol = productionRule.symbols[symbolIndex];

            for (const attribute of symbol.attributes.values()) {

                // DFS
                const visited = new Set();
                const parents = new Map();
                const dependencyStack = [];

                dependencyStack.push(...attribute.getAllDependencies());

                while (!arrayIsEmpty(dependencyStack)) {

                    const dependency = dependencyStack.pop();

                    const targetHash = dependency.targetHash();
                    const targetAttribute = productionRule.symbols[dependency.toSymbolIndex].attributes.getAt(dependency.toAttributeIndexInsideSymbol);

                    // By traversing the graph with DFS, we came back to the attribute, where we started.
                    if (symbolIndex === dependency.toSymbolIndex && attribute.name === targetAttribute.name) {
                        productionRule.iterations[iterationNumber].cycleFound = 'yes';
                        this.#strongAcyclicity.isStronglyAcyclic = 'no';
                        break;
                    }

                    // New attribute, not yet visited during the DFS.
                    if (!visited.has(targetHash)) {

                        visited.add(targetHash);

                        // In a dependency: a -> b, we set the source 'a' as the parent of the target 'b'.
                        // This is needed, to later go back to the parents and add transitive closures.
                        parents.set(targetHash, dependency.getSourceAttributeCoordinates());

                        dependencyStack.push(...targetAttribute.getAllDependencies());

                        // This dependency points to an attribute at the root node. That's good, because we want to
                        // calculate the root projections, which are relations that start and end at the root.
                        // So now we need to build transitive closures from this attribute backwards, and see
                        // whether we find a source attribute, which also is at the root node.
                        if (symbolIsRoot(dependency.toSymbolIndex)) {

                            let parentCoordinates = parents.get(dependency.targetHash());

                            // Traverse the DFS branch back to the start node.
                            while (parentCoordinates !== undefined) {

                                const parentAttribute = productionRule.symbols[parentCoordinates.symbolIndex].attributes.getAt(parentCoordinates.attributeIndex);
                                const parentHash = `${parentCoordinates.symbolIndex}${parentAttribute.name}`;

                                // We've found a parent attribute, which is also at the root - we have a root projection!
                                if (symbolIsRoot(parentCoordinates.symbolIndex)) {

                                    const newRootProjection = new Dependency(
                                        parentAttribute.name, parentCoordinates.symbolIndex, parentCoordinates.attributeIndex,
                                        targetAttribute.name, dependency.toSymbolIndex, dependency.toAttributeIndexInsideSymbol);

                                    this.#addRootProjection(productionRule, iterationNumber, newRootProjection);
                                    this.#addTransitiveRelation(nonterminal, iterationNumber, newRootProjection);
                                }

                                // Get the grandparent.
                                parentCoordinates = parents.get(parentHash);
                            }
                        }
                    }
                }
            }
        }
    }

    #addRootProjection(productionRule, iterationNumber, newDependency) {
        productionRule.iterations[iterationNumber].rootProjections.set(newDependency.hash(), newDependency);
    }

    #addTransitiveRelation(nonterminal, iterationNumber, newDependency) {
        nonterminal.iterations[iterationNumber].transitiveRelations.set(newDependency.hash(), newDependency);
    }


    #nonterminalIsUnstable(nonterminal, iterationIndex, prevNonterminalIteration) {

        // The very first iteration cannot be stable.
        if (iterationIndex === 0)
            return true;

        const currentTransitiveRelations = nonterminal.iterations[iterationIndex].transitiveRelations;
        const previousTransitiveRelations = prevNonterminalIteration.transitiveRelations;

        if (mapKeysAreEqual(currentTransitiveRelations, previousTransitiveRelations)) {
            nonterminal.iterations[iterationIndex].isStable = true;
            return false;
        } else {
            return true;
        }
    }


    #addError(lineNumberBase0, placeInTextWithTheError, warningMessage) {
        const lineNumberBase1 = lineNumberBase0 + 1;
        this.#errors.push(`<code>Line ${lineNumberBase1}: '${placeInTextWithTheError}'&nbsp;&nbsp;</code>${warningMessage}`);
    }

    get errors() {
        return this.#errors;
    }

    get productionRules() {
        return this.#productionRules;
    }

    get allAttributeNames() {
        return this.#allAttributeNames;
    }

    get allAttributeNamesArray() {
        return Array.from(this.#allAttributeNames);
    }

    get allSymbolNames() {
        return this.#allSymbolNames;
    }

    get numberOfElementsPerRule() {
        return this.#numberOfElementsPerRule;
    }

    get strongAcyclicity() {
        return this.#strongAcyclicity;
    }
}


/**
 * Production Rule class
 *
 * A production rule is relation between a non-terminal and a sequence of some symbols (terminals, or non-terminals).
 * eg.:  S -> S T a b
 *
 * By convention, they are numbered from 0 to n.
 * So a production rule object stores an array of symbols, in the order they were declared in the grammar.
 */
class ProductionRule {

    symbols = [];
    symbolNames = [];
    iterations = [];

    addSymbol(newSymbol) {
        this.symbols.push(newSymbol);
        this.symbolNames.push(newSymbol.name);
    }

    has(symbolName) {
        return isInArray(this.symbolNames, symbolName);
    }

    numberOfSymbols() {
        return this.symbols.length;
    }

    maxIndex() {
        return this.numberOfSymbols() - 1;
    }

    emptyWordOnTheRight() {
        return this.numberOfSymbols() === 1;
    }

    leftSide() {
        // The left side consists of exactly one symbol - the first one.
        return this.symbols[0];
    }

    rightSide() {
        // The left side consists of exactly one symbol. So the right side is made up of the remaining symbols.
        return this.symbols.slice(1);
    }

    rightSideLength() {
        return this.rightSide().length;
    }

    addIteration() {
        this.iterations.push(new ProductionRuleIteration());
    }

    toString() {
        let output = this.symbolNames[0] + ' ->';

        if (this.emptyWordOnTheRight()) {
            output += ' ε';
        } else {
            for (let i = 1; i < this.numberOfSymbols(); i++) {
                output += ' ' + this.symbolNames[i];
            }
        }
        return output;
    }
}


/**
 * Symbol class
 *
 * A symbol can be a non-terminal or a terminal. It is represented by a sequence of letters, eg. 'S', 'item'.
 *
 * Each symbol can be defined by a number of attributes, which are stored in an indexed map.
 */
class Symbol {

    name;
    attributes = new IndexedMap();

    constructor(name) {
        this.name = name;
    }

    addAttribute(newAttribute) {
        return this.addAttributeAndDependency(newAttribute);
    }

    addAttributeAndDependency(newAttribute, newDependency) {
        if (this.attributes.has(newAttribute.name)) {

            if (parameterHasBeenSpecified(newDependency)) {
                const existingAttribute = this.attributes.get(newAttribute.name);
                existingAttribute.addDependency(newDependency);
            }
        } else {
            if (parameterHasBeenSpecified(newDependency)) {
                newAttribute.addDependency(newDependency);
            }
            this.attributes.add(newAttribute.name, newAttribute);
        }
    }

    has(attribute) {
        return this.attributes.has(attribute.name);
    }

    isNonterminal(nonterminalNames) {
        return nonterminalNames.has(this.name);
    }

    toString() {
        return '(' + this.name + (this.attributes.length === 0 ? ')' : ': ' + this.attributes + ')');
    }
}


/**
 * Attribute class
 *
 * An attribute defines a symbol.
 * Attributes can be related between themselves. Both within one symbol, and between different symbols.
 *
 * This relation is called dependency. Here we save the dependency only in the source attribute.
 * So if there is a dependency between attributes 'a' and 'b':
 *   a -> b
 * then attribute 'a' would store the dependency to 'b'. And attribute 'b' would not store this dependency.
 */
class Attribute {

    name;
    dependencies = new Map();
    redecoratedDependencies = []; // Used to calculate the transitive closure.
    indirectlyIdentified = false;

    constructor(name) {
        this.name = name;
    }

    addDependency(newDependency) {
        this.dependencies.set(newDependency.hash(), newDependency);
    }

    addRedecoratedDependency(newRedecoratedDependency) {
        this.redecoratedDependencies.push(newRedecoratedDependency);
    }

    emptyRedecoratedDependencies() {
        emptyArray(this.redecoratedDependencies);
    }

    getAllDependencies() {
        return [...this.dependencies.values(), ...this.redecoratedDependencies];
    }

    equals(otherAttribute) {
        return this.name === otherAttribute.name;
    }

    toString() {
        return this.name + (this.dependencies.length === 0 ? '' : '->{' + [...this.dependencies.values()] + '}');
    }
}


/**
 * Dependency class
 *
 * A dependency is a relation between two attributes.
 *
 * In order to describe the 'to' side of the dependency, i.e. the target, we store the
 * - target attribute name
 * - index of the symbol, to which the target attribute is related (the index inside the production rule)
 * - index of the target attribute, inside the indexed map of the corresponding symbol
 *
 * If an attribute 'z' would have a dependency with an attribute 'c' of the non-terminal 'T' in this production rule:
 * S -> T a  :  ['a', 'b', 'c', 'd']
 * Then the stored values in the dependency object ('z' -> 'c') would be:
 * - toAttributeName = 'c'
 * - toSymbolIndex = 1
 * - toAttributeIndexInsideSymbol = 2
 *
 * The same logic is used to store the 'from' side of the dependency, using the variables:
 * - fromAttributeName
 * - fromSymbolIndex
 * - fromAttributeIndexInsideSymbol
 */
class Dependency {

    fromAttributeName;
    toAttributeName;

    fromSymbolIndex;
    toSymbolIndex;

    fromAttributeIndexInsideSymbol;
    toAttributeIndexInsideSymbol;

    static forUnsortedAttribute(fromAttributeName, fromSymbolIndex, toAttributeName, toSymbolIndex) {
        return new Dependency(fromAttributeName, fromSymbolIndex, null,
            toAttributeName, toSymbolIndex, null);
    }

    static redecorateTo(relation, newSymbolIndex) {
        return new Dependency(relation.fromAttributeName, newSymbolIndex, relation.fromAttributeIndexInsideSymbol,
            relation.toAttributeName, newSymbolIndex, relation.toAttributeIndexInsideSymbol);
    }

    constructor(fromAttributeName, fromSymbolIndex, fromAttributeIndexInsideSymbol,
                toAttributeName, toSymbolIndex, toAttributeIndexInsideSymbol) {
        this.fromAttributeName = fromAttributeName;
        this.fromSymbolIndex = fromSymbolIndex;
        this.fromAttributeIndexInsideSymbol = fromAttributeIndexInsideSymbol;
        this.toAttributeName = toAttributeName;
        this.toSymbolIndex = toSymbolIndex;
        this.toAttributeIndexInsideSymbol = toAttributeIndexInsideSymbol;
    }

    equals(otherDependency) {
        return this.hash() === otherDependency.hash();
    }

    getSourceAttributeCoordinates() {
        return {symbolIndex: this.fromSymbolIndex, attributeIndex: this.fromAttributeIndexInsideSymbol};
    }

    sourceHash() {
        return `${this.fromSymbolIndex}${this.fromAttributeName}`;
    }

    targetHash() {
        return `${this.toSymbolIndex}${this.toAttributeName}`;
    }

    hash() {
        return this.sourceHash() + this.targetHash();
    }

    toRelationString() {
        return `(${this.fromAttributeName},${this.toAttributeName})`;
    }

    toString() {
        return `${this.fromAttributeName}_${this.fromAttributeIndexInsideSymbol}[${this.fromSymbolIndex}]` +
            ` -> ${this.toAttributeName}_${this.toAttributeIndexInsideSymbol}[${this.toSymbolIndex}]`;
    }
}


/**
 * Strong Acyclicity class
 */
class StrongAcyclicity {

    nonterminals = new IndexedMap();
    isStronglyAcyclic = 'yes';
    isIterationStable = [];

    addIteration() {
        // Default it to stable and only change to unstable, if some instability found.
        this.isIterationStable.push('yes');
    }

    setIterationUnstable(iterationIndex) {
        this.isIterationStable[iterationIndex] = 'no';
    }
}


/**
 * Nonterminal class
 */
class Nonterminal {

    name;
    iterations = [];
    productionRules = [];

    constructor(name) {
        this.name = name;
    }

    addIteration() {
        this.iterations.push(new NonterminalIteration());
    }

    /* In the algorithm to calculate the strong acyclicity, we are looping through all non-terminals in each iteration.
     * - CASE 1: This is the easy one. If it is the first iteration, there are no previous ones, so we return an empty object.
     * - CASE 3: When we come to a new nonterminal in our loop, we first add a NonterminalIteration and then use
     *           the getPreviousIteration() function. Say we are at iterationIndex = 1. After adding a NonterminalIteration,
     *           iterations.length becomes 2. So to get the previous iteration, we need to get the penultimate item in the
     *           array, which is the 1st item (index 0).
     * - CASE 2: This case happens when we redecorate. Say we have:
     *              - nonterminals: A, B
     *              - production rules: A -> B t,  B -> s
     *           We start an iteration loop with A. Then we go and redecorate the productions of A, which is A -> B t.
     *           In this production rule, when we come to B, we want to get the transitive relations from B's previous
     *           iteration. But because we have started with A and did not come to the nonterminal B yet, B has one
     *           iteration less than A in the array. So its array length matches the current iteration index. And B's
     *           previous iteration is the last item in the iterations array.
     */
    getPreviousIteration(currentIterationIndex) {
        // CASE 1
        if (currentIterationIndex === 0)
            return NonterminalIteration.empty;

        // CASE 2
        if (this.#currentIterationObjectNotYetCreated(currentIterationIndex)) {
            return getLastArrayItem(this.iterations);
        }

        // CASE 3
        return getPenultimateArrayItem(this.iterations);
    }

    #currentIterationObjectNotYetCreated(currentIterationIndex) {
        return currentIterationIndex === this.iterations.length;
    }
}


/**
 * Nonterminal iteration class
 */
class NonterminalIteration {

    static empty = new NonterminalIteration();

    isStable = false;
    transitiveRelations = new Map();

    transitiveRelationsString() {
        return Array.from(this.transitiveRelations.values())
            .map(dependency => dependency.toRelationString())
            .sort()
            .toString();
    }
}


/**
 * Production rule iteration class
 */
class ProductionRuleIteration {

    static empty = new ProductionRuleIteration();

    cycleFound = 'no';
    rootProjections = new Map();
    redecoratedRelations = new Map();

    addRedecoratedRelation(relation) {
        this.redecoratedRelations.set(relation.hash(), relation);
    }
}