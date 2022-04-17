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
    isInArray
} from './utils.js';

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


    constructor(grammarText) {

        const grammarTextRows = splitIntoRows(replaceMultipleWhiteSpacesByOne(grammarText));

        for (const row of grammarTextRows) {

            if (textIsEmpty(row)) continue;

            const rowHalves = row.split(':');

            if (rowHalves.length > 2) {
                this.#addError(row, "There can only be one separator ':' in a row.");
            }

            const productionRuleText = rowHalves[0];
            const parsingResult = this.#parseProductionRule(productionRuleText);
            if (parsingResult === ERROR) continue;

            // A production rule must not necessarily have some attribute attached.
            // Thus, we only parse the attributes, if there are any.
            if (rowHalves.length === 2) {
                const attributesText = rowHalves[1];
                this.#parseAttributes(attributesText);
            }
        }

        this.#computeTerminals();
    }


    #parseProductionRule(productionRuleText) {

        const productionRule = new ProductionRule();

        const productionRuleHalves = productionRuleText.split('->');
        if (productionRuleHalves.length !== 2) {
            this.#addError(productionRuleText, "The production rule must be separated by one arrow '->'.");
            return ERROR;
        }

        const parsingLeftSideResult = this.#parseProductionRuleLeftSide(productionRuleText, productionRuleHalves[0], productionRule);
        const parsingRightSideResult = this.#parseProductionRuleRightSide(productionRuleText, productionRuleHalves[1], productionRule);

        if (parsingLeftSideResult === ERROR || parsingRightSideResult === ERROR) return ERROR;

        this.#productionRules.push(productionRule);
    }


    #parseProductionRuleLeftSide(productionRuleText, productionRuleLeftText, productionRule) {

        const productionLeftSymbols = splitIntoWords(productionRuleLeftText);
        const leftNonterminal = productionLeftSymbols[0];

        if (textIsEmpty(leftNonterminal)) {
            this.#addError(productionRuleText, 'A nonterminal is missing on the left side of the production.');
            return ERROR;
        }

        if (containsAny(leftNonterminal, this.#FORBIDDEN_SYMBOLS)) {
            this.#addError(leftNonterminal, `The characters '${this.#FORBIDDEN_SYMBOLS.join(' ')}' are not allowed as (non-)terminals.`);
            return ERROR;
        }

        if (productionLeftSymbols.length > 1) {
            this.#addError(productionRuleText, 'There may only be one nonterminal on the left side of a production rule.');
            return ERROR;
        }

        productionRule.addSymbol(new Symbol(leftNonterminal));

        this.#allNonterminalNames.add(leftNonterminal);
        this.#allSymbolNames.add(leftNonterminal);
    }


    #parseProductionRuleRightSide(productionRuleText, productionRuleRightText, productionRule) {

        if (textIsEmpty(productionRuleRightText)) {
            // An empty production right side stands for an empty word (ε). So there are no symbols to add.
            return;
        }

        if (containsAny(productionRuleRightText, this.#FORBIDDEN_SYMBOLS)) {
            this.#addError(productionRuleRightText, `The characters '${this.#FORBIDDEN_SYMBOLS.join(' ')}' are not allowed as (non-)terminals.` +
                " Maybe you forgot the ':' as a separation between the production rule and the attribute equations?");
            return ERROR;
        }

        const productionRightSymbols = splitIntoWords(productionRuleRightText);

        for (const symbol of productionRightSymbols) {
            productionRule.addSymbol(new Symbol(symbol));
            this.#allSymbolNames.add(symbol);
        }
    }


    #parseAttributes(attributesText) {

        const attributeEquations = attributesText.split(';');

        for (const attributeEquation of attributeEquations) {

            const equationHalves = attributeEquation.split('=');

            if (equationHalves.length === 1) {
                this.#addError(attributeEquation, "The attribute equation needs to have a '='.");
                continue;
            }
            if (equationHalves.length > 2) {
                this.#addError(attributeEquation, "There can only be one equals sign '=' in an equation.");
                continue;
            }

            const attributeNameAndIndexMatcher = /.*?(\w+?)\[(\d+?)].*?/g;
            const productionRule = getLastArrayItem(this.#productionRules);

            const leftAttribute = this.#parseLeftAttribute(equationHalves[0], attributeEquation, productionRule, attributeNameAndIndexMatcher);
            if (leftAttribute === ERROR) return;

            // We can move on, without check, whether there was a parsing error of the right attribute, as we have done for the left one.
            // This is because no further functions depend on the parsed values of the right attributes and so no runtime error can occur.
            // This way we parse as many attributes as possible, without aborting and can show more warnings to the user.
            this.#parseRightAttribute(equationHalves[1], attributeEquation, leftAttribute, productionRule, attributeNameAndIndexMatcher);
        }

        this.#mergeMissingAttributesAndSort();
        this.#defineAttributeIndexesInDependenciesAndCountElements();
    }


    #parseLeftAttribute(equationLeftHalf, attributeEquation, productionRule, attributeNameAndIndexMatcher) {

        const matchedLeftAttributes = Array.from(equationLeftHalf.matchAll(attributeNameAndIndexMatcher));

        if (!matchedLeftAttributes) {
            this.#addError(attributeEquation, 'The attribute on the left hand side of the equation is wrongly formatted.');
            return ERROR;
        }

        if (matchedLeftAttributes.length > 1) {
            this.#addError(attributeEquation, 'There can only be one attribute on the left of the equation.');
            return ERROR;
        }

        // We checked previously, that there can only be one match, so it is safe to access index 0.
        const matchedLeftAttribute = matchedLeftAttributes[0];

        const leftAttributeName = matchedLeftAttribute[1];
        const leftAttributeSymbolIndex = matchedLeftAttribute[2];

        if (leftAttributeSymbolIndex > productionRule.maxIndex()) {
            this.#addError(attributeEquation, `The index in '${equationLeftHalf}' is higher than the number of symbols in the production.`);
            return ERROR;
        }

        this.#allAttributeNames.add(leftAttributeName);

        const symbolOfLeftAttribute = productionRule.symbols[leftAttributeSymbolIndex];
        const newLeftAttribute = new Attribute(leftAttributeName);

        symbolOfLeftAttribute.addAttribute(newLeftAttribute);

        this.#addAttributeToSymbolListOfAttributes(symbolOfLeftAttribute, newLeftAttribute);

        return {name: leftAttributeName, symbolIndex: leftAttributeSymbolIndex,};
    }


    #parseRightAttribute(equationRightHalf, attributeEquation, leftAttribute, productionRule, attributeNameAndIndexMatcher) {

        const matchedRightAttributes = Array.from(equationRightHalf.matchAll(attributeNameAndIndexMatcher));

        // There may be attribute equations, where an attribute has no dependency to another attribute.
        // eg. z[0] = 0. In these cases, there is no attribute on the right, and we do nothing.
        // On the other hand, there may be several attributes on the right, eg. z[0] = max(z[1], z[2]).
        // So we need to go through all the matched attributes and create a relation for each of them.
        for (const matchedRightAttribute of matchedRightAttributes) {

            const rightAttributeName = matchedRightAttribute[1];
            const rightAttributeIndex = matchedRightAttribute[2];

            if (rightAttributeIndex > productionRule.maxIndex()) {
                this.#addError(attributeEquation, `The index in '${equationRightHalf}' is higher than the number of symbols in the production.`);
                return;
            }

            this.#allAttributeNames.add(rightAttributeName);

            const newRightAttribute = new Attribute(rightAttributeName);
            const dependencyFromRightToLeftAttribute = new Dependency(leftAttribute.name, leftAttribute.symbolIndex);

            const symbolOfRightAttribute = productionRule.symbols[rightAttributeIndex];
            symbolOfRightAttribute.addAttributeAndDependency(newRightAttribute, dependencyFromRightToLeftAttribute);

            this.#addAttributeToSymbolListOfAttributes(symbolOfRightAttribute, newRightAttribute);
        }
    }


    #addAttributeToSymbolListOfAttributes(symbol, newAttribute) {

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
            existingAttributes.set(newAttributeName, newCleanAttribute);

        } else {

            this.#attributesBySymbol.set(symbolName, new Map([[newAttributeName, newCleanAttribute]]));
        }
    }


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


    #defineAttributeIndexesInDependenciesAndCountElements() {

        for (let i = 0; i < this.#productionRules.length; i++) {

            const productionRule = this.#productionRules[i];
            this.#numberOfElementsPerRule[i] = 0;

            for (const symbol of productionRule.symbols) {
                this.#numberOfElementsPerRule[i]++;

                for (const [attributeName, attribute] of symbol.attributes) {
                    this.#numberOfElementsPerRule[i]++;

                    for (const dependency of attribute.dependencies) {

                        const toSymbol = productionRule.symbols[dependency.toSymbolIndex];

                        const attributeIndexInsideSymbol = toSymbol.attributes.getIndexOf(dependency.toAttributeName);
                        if (attributeIndexInsideSymbol === ERROR) {
                            this.#addError('#defineAttributeIndexesInDependencies()',
                                'An unexpected bug occurred in this function. Please report it, together with the used grammar.');
                        }

                        dependency.toAttributeIndexInsideSymbol = attributeIndexInsideSymbol;
                    }
                }
            }
        }
    }


    #computeTerminals() {

        for (const symbol of this.#allSymbolNames) {

            // A nonterminal is a symbol X, for which there is a production rule, eg.: X -> Y z.
            // All nonterminals have been computed, when parsing the production rules.
            // So the terminals are all the remaining symbols, which are not contained in the nonterminal set.
            if (!this.#allNonterminalNames.has(symbol)) {
                this.#allTerminalNames.add(symbol);
            }
        }
    }


    #addError(placeInTextWithTheError, warningMessage) {
        this.#errors.push(`<code>'${placeInTextWithTheError}'&nbsp;&nbsp;</code>${warningMessage}`);
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
                if (existingAttribute.doesNotYetHave(newDependency)) {
                    existingAttribute.addDependency(newDependency);
                }
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
 * a -> b
 * then attribute 'a' would store the dependency to 'b'. And attribute 'b' would not store this dependency.
 */
class Attribute {

    name;
    dependencies = [];
    indirectlyIdentified = false;

    constructor(name) {
        this.name = name;
    }

    addDependency(newDependency) {
        if (this.doesNotYetHave(newDependency)) {
            this.dependencies.push(newDependency);
        }
    }

    doesNotYetHave(newDependency) {
        let attributeDoesNotYetHaveThisDependency = true;
        for (const existingDependency of this.dependencies) {
            if (existingDependency.equals(newDependency)) {
                attributeDoesNotYetHaveThisDependency = false;
            }
        }
        return attributeDoesNotYetHaveThisDependency;
    }

    getDependencyMap() {
        const dependencyMap = new Map();
        for (const dependency of this.dependencies) {
            dependencyMap.set(dependency.toAttributeName, dependency);
        }
        return dependencyMap;
    }

    equals(otherAttribute) {
        return this.name === otherAttribute.name;
    }

    toString() {
        return this.name + (this.dependencies.length === 0 ? '' : '->{' + this.dependencies + '}');
    }
}


/**
 * Dependency class
 *
 * A dependency is a relation between two attributes. It is also a property of the source attribute,
 * so the 'from' side of the relation is already defined.
 *
 * In order to describe the 'to' side of the dependency, i.e. the target, we store the
 * - target attribute name
 * - index of the symbol, to which the target attribute is related (the index inside the production rule)
 * - index of the target attribute, inside the indexed map of the corresponding symbol
 *
 * If an attribute 'z' would have a dependency with an attribute 'c' of the non-terminal 'T' in this production rule:
 * S -> P T a  :  ['a', 'b', 'c', 'd']
 * Then the stored values in the dependency object ('z' -> 'c') would be:
 * - toAttributeName = 'c'
 * - toSymbolIndex = 2
 * - toAttributeIndexInsideSymbol = 3
 */
class Dependency {
    toAttributeName;
    toSymbolIndex;
    toAttributeIndexInsideSymbol;

    constructor(toAttributeName, toSymbolIndex) {
        this.toAttributeName = toAttributeName;
        this.toSymbolIndex = toSymbolIndex;
    }

    equals(otherDependency) {
        return this.toAttributeName === otherDependency.toAttributeName
            && this.toSymbolIndex === otherDependency.toSymbolIndex;
    }

    toString() {
        return `${this.toAttributeName}[${this.toSymbolIndex}]`;
    }
}
