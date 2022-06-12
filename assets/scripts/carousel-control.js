class CarouselControl {
  constructor(/** @type {HTMLElement} */ controlElm) {
    this._controlElm = controlElm;
    /** @type {HTMLElement} */
    this._carouselElm = document.getElementById(controlElm.dataset.target);
    console.log(this._carouselElm);
    this.pageCount = parseInt(controlElm.dataset.pageCount, 10);
    /** @type {HTMLInputElement} */
    this._slider = controlElm.querySelector("[name=page]");
    /** @type {HTMLElement} */
    this._pageNumberElm = controlElm.querySelector("[data-page-number]");
    /** @type {HTMLButtonElement} */
    this._prevButton = controlElm.querySelector("[name=prev]");
    /** @type {HTMLButtonElement} */
    this._nextButton = controlElm.querySelector("[name=next]");
    this._currentPageIdx = 0;

    this._calcSlideWidth();
    this._handleScroll();
    this._carouselElm.addEventListener("scroll", this._handleScroll);
    this._slider.addEventListener("input", this._handleSlideInput);
    this._nextButton.addEventListener("click", this._next);
    this._prevButton.addEventListener("click", this._prev);
    this._controlElm.addEventListener("keydown", this._handleKeyDown);
    window.addEventListener("resize", this._handleResize)
  }

  /**
   * カルーセルの1スライドあたりのスクロール量を計算する
   */
  _calcSlideWidth = () => {
    this._slideWidth =
      (this._carouselElm.scrollWidth - this._carouselElm.clientWidth) /
      (this.pageCount - 1);
  };

  /**
   * スライド番号のインジケータやスライダーの値を更新する
   * @param {number} idx 0-indexed
   */
  _updatePageIdx = (idx) => {
    if (this._currentPageIdx === idx) {
      return;
    }
    this._currentPageIdx = idx;
    const pageNum = (idx + 1).toString(10);
    this._pageNumberElm.textContent = pageNum;
    this._slider.value = pageNum;
  };

  _handleScroll = () => {
    const idx = Math.round(this._carouselElm.scrollLeft / this._slideWidth);
    this._updatePageIdx(idx);
  };

  _handleSlideInput = () => {
    const idx = parseInt(this._slider.value, 10) - 1;
    this._scrollTo(idx);
  };

  /**
   * 指定したスライドまでスクロールする
   * @param {number} idx
   */
  _scrollTo = (idx) => {
    this._carouselElm.scroll({ left: this._slideWidth * idx });
  };

  _handleResize = () => {
    this._calcSlideWidth();
  };

  /**
   * 次のスライドまでスクロールする
   */
  _next = () => {
    this._carouselElm.scrollBy({ left: this._slideWidth });
  };

  /**
   * 前のスライドまでスクロールする
   */
  _prev = () => {
    this._carouselElm.scrollBy({ left: -1 * this._slideWidth });
  };

  /**
   * @param {KeyboardEvent} e
   */
  _handleKeyDown = (e) => {
    // 左右キーでスライドを切り替えられるようにする
    switch (e.key) {
      case "ArrowLeft": {
        e.preventDefault();
        this._prev();
        break;
      }
      case "ArrowRight": {
        e.preventDefault();
        this._next();
        break;
      }
      default: {
        break;
      }
    }
  };
}

document
  .querySelectorAll(".carousel-control")
  .forEach((/** @type {HTMLDivElement} */ controlElm) => {
    new CarouselControl(controlElm);
  });
