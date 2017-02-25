const clone = require('../../util/clone');
const print = require('../../util/print');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');
const Util = require('../../util/Util');

const CONSTANT = 'constant';
const CONSTANT_FRACTION = 'constantFraction';
const OTHER = 'other';

const LikeTermCollector = {};

// Given an expression tree, returns true if there are terms that can be
// collected
LikeTermCollector.canCollectLikeTerms = function(node) {
  // We can collect like terms through + or through *
  // Note that we never collect like terms with - or /, those expressions will
  // always be manipulated in flattenOperands so that the top level operation is
  // + or *.
  if (!(Node.Type.isOperator(node, '+') || Node.Type.isOperator(node, '*'))) {
    return false;
  }

  let terms;
  if (node.op === '+') {
    terms = getTermsForCollectingAddition(node);
  }
  else if (node.op === '*') {
    terms = getTermsForCollectingMultiplication(node);
  }
  else {
    throw Error('Operation not supported: ' + node.op);
  }

  // Conditions we need to meet to decide to to reorganize (collect) the terms:
  // - more than 1 term type
  // - more than 1 of at least one type (not including other)
  // (note that this means x^2 + x + x + 2 -> x^2 + (x + x) + 2,
  // which will be recorded as a step, but doesn't change the order of terms)
  const termTypes = Object.keys(terms);
  const filteredTermTypes = termTypes.filter(x => x !== OTHER);
  return (termTypes.length > 1 &&
    filteredTermTypes.some(x => terms[x].length > 1));
};

// Collects like terms for an operation node and returns a Node.Status object.
LikeTermCollector.collectLikeTerms = function(node) {
  if (!LikeTermCollector.canCollectLikeTerms(node)) {
    return Node.Status.noChange(node);
  }

  const op = node.op;
  let terms = [];
  if (op === '+') {
    terms = getTermsForCollectingAddition(node);
  }
  else if (op === '*') {
    terms = getTermsForCollectingMultiplication(node);
  }
  else {
    throw Error('Operation not supported: ' + op);
  }

  // List the symbols alphabetically
  const termTypesSorted = Object.keys(terms)
      .filter(x => (x !== CONSTANT && x !== CONSTANT_FRACTION && x !== OTHER))
      .sort(sortTerms);


  // Then add const
  if (terms[CONSTANT]) {
    // at the end for addition (since we'd expect x^2 + (x + x) + 4)
    if (op === '+') {
      termTypesSorted.push(CONSTANT);
    }
    // for multipliation it should be at the front (e.g. (3*4) * x^2)
    if (op === '*') {
      termTypesSorted.unshift(CONSTANT);
    }
  }
  if (terms[CONSTANT_FRACTION]) {
    termTypesSorted.push(CONSTANT_FRACTION);
  }

  // Collect the new operands under op.
  let newOperands = [];
  let changeGroup = 1;
  termTypesSorted.forEach(termType => {
    const termsOfType = terms[termType];
    if (termsOfType.length === 1) {
      const singleTerm = clone(termsOfType[0]);
      singleTerm.changeGroup = changeGroup;
      newOperands.push(singleTerm);
    }
    // Any like terms should be wrapped in parens.
    else {
      const termList = clone(Node.Creator.parenthesis(
        Node.Creator.operator(op, termsOfType)));
      termList.changeGroup = changeGroup;
      newOperands.push(termList);
    }
    termsOfType.forEach(term => {
      term.changeGroup = changeGroup;
    });
    changeGroup++;
  });

  // then stick anything else (paren nodes, operator nodes) at the end
  if (terms[OTHER]) {
    newOperands = newOperands.concat(terms[OTHER]);
  }

  const newNode = clone(node);
  newNode.args = newOperands;
  return Node.Status.nodeChanged(
    ChangeTypes.COLLECT_LIKE_TERMS, node, newNode, false);
};

function getTermName(node, op) {
  const polyNode = new Node.PolynomialTerm(node);
  let termName = polyNode.getSymbolName();
  return termName; // Term name without exponent
}