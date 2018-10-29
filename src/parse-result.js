/*
 * Parse result-specific refract elements.
 *
 * General structure:
 *
 * + ParseResult
 *   + Annotation
 */

import apiDescription from 'minim-api-description';

export function namespace(options) {
  const minim = options.base;
  const { Element } = minim;
  const StringElement = minim.getElementClass('string');
  const ArrayElement = minim.getElementClass('array');

  /**
   * @class ParseResult
   *
   * @param {Array} content
   * @param meta
   * @param attributes
   *
   * @extends ArrayElement
   */
  class ParseResult extends ArrayElement {
    constructor(...args) {
      super(...args);
      this.element = 'parseResult';
    }

    /**
     * @name api
     * @type Category
     * @memberof ParseResult.prototype
     */
    get api() {
      return this.children.filter(item => item.classes.contains('api')).first;
    }

    /**
     * @callback mapElementCallback
     * @param {Element} element
     */

    /** Returns a new ParseResult by transforming non-annotation values using `transform`.
     * @param {mapElementCallback} transform
     * @param thisArg
     * @returns array
     * @memberof ParseResult.prototype
     */
    mapElement(transform, thisArg) {
      return new ParseResult(super.map((element) => {
        if (element.element === 'annotation') {
          return element;
        }

        return transform(element);
      }, thisArg));
    }

    /**
     * @callback flatMapElementCallback
     * @param {Element} element
     * @returns {ParseResult}
     */

    /** Returns the result of applying `transform` to non-annotation values, flattening the result.
     * @param {flatMapElementCallback} transform
     * @param thisArg
     * @returns {ParseResult}
     * @memberof ParseResult.prototype
     */
    flatMapElement(transform, thisArg) {
      return this.reduce((result, element) => {
        if (element.element === 'annotation') {
          result.push(element);
        } else {
          transform.bind(thisArg, element).call().forEach(item => result.push(item));
        }

        return result;
      }, new ParseResult());
    }

    /**
     * @name annotations
     * @type ArraySlice
     * @memberof ParseResult.prototype
     */
    get annotations() {
      return this.children.filter(item => item.element === 'annotation');
    }

    /**
     * @name warnings
     * @type ArraySlice
     * @memberof ParseResult.prototype
     */
    get warnings() {
      return this.children
        .filter(item => item.element === 'annotation' && item.classes.contains('warning'));
    }

    /**
     * @name errors
     * @type ArraySlice
     * @memberof ParseResult.prototype
     */
    get errors() {
      return this.children
        .filter(item => item.element === 'annotation' && item.classes.contains('error'));
    }
  }

  /**
   * @class Annotation
   *
   * @param {string} content
   * @param meta
   * @param attributes
   *
   * @extends StringElement
   */
  class Annotation extends StringElement {
    constructor(...args) {
      super(...args);
      this.element = 'annotation';
    }

    get code() {
      return this.attributes.get('code');
    }

    set code(value) {
      this.attributes.set('code', value);
    }
  }

  /**
   * @class SourceMap
   *
   * @param {Array} content
   * @param meta
   * @param attributes
   *
   * @extends ArrayElement
   */
  class SourceMap extends minim.elements.Array {
    constructor(...args) {
      super(...args);
      this.element = 'sourceMap';
    }

    // Override toValue because until Refract 1.0
    // sourceMap is special element that contains array of array
    // TODO Remove in next minor release
    toValue() {
      return this.content.map(value => value.map(element => element.toValue()));
    }
  }

  /**
   * @name sourceMapValue
   * @type Array
   * @memberof Element.prototype
   */
  if (!Object.getOwnPropertyNames(Element.prototype).includes('sourceMapValue')) {
    Object.defineProperty(Element.prototype, 'sourceMapValue', {
      get() {
        const sourceMap = this.attributes.get('sourceMap');

        if (sourceMap) {
          return sourceMap.first.toValue();
        }

        return undefined;
      },
    });
  }

  minim
    .use(apiDescription)
    .register('parseResult', ParseResult)
    .register('annotation', Annotation)
    .register('sourceMap', SourceMap);
}

export default { namespace };
