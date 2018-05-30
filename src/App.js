import React, { Component } from 'react';

const SIZE = 30;

function abbreviateNumber(number) {
  const SI_PREFIXES = ["", "k", "M", "G", "T", "P", "E"];

  const tier = Math.log10(number) / 3 | 0;
  if (tier === 0) {
    return number;
  }
  const prefix = SI_PREFIXES[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = number / scale;
  return scaled.toFixed(1) + prefix;
}

function timeDiff(timestamp) {
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDiff = currentTime - timestamp;
  if (timeDiff < 60) {
    return `${timeDiff}s`;
  }

  const timeDiffInMin = Math.floor(timeDiff / 60);
  if (timeDiffInMin < 60) {
    return `${timeDiffInMin}m`;
  }

  const timeDiffInHour = Math.floor(timeDiffInMin / 60);
  if (timeDiffInHour < 60) {
    return `${timeDiffInHour}h`;
  }

  const timeDiffInDay = Math.floor(timeDiffInHour / 24);
  return `${timeDiffInDay}d`;
}

function handleCaption(caption) {
  let returnString = caption.replace(/(^|\s)([#][a-z\d-]+)/g,'$1<a className="tag" href="https://www.instagram.com/explore/tags/$2/" target="_blank">$2</a>');
  returnString = returnString.replace(/(^|\s)([@][a-z\d-]+)/g,'$1<a className="tag" href="https://www.instagram.com/$2/" target="_blank">$2</a>');
  returnString = returnString.replace(/www.instagram.com\/explore\/tags\/#/g, 'www.instagram.com/explore/tags/');
  returnString = returnString.replace(/www.instagram.com\/@/g, 'www.instagram.com/');
  return returnString;
}

class TabBar extends Component {
  render() {
    return (
      <div>
        <ul className="nav nav-tabs" id="myTab" role="tablist">
          <li className="nav-item">
            <a className="nav-link active" data-toggle="tab" href="javascript:void(0);" onClick={() => this.props.fetchData('hot', 0, SIZE)} >Hot</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" data-toggle="tab" href="javascript:void(0);" onClick={() => this.props.fetchData('fresh', 0, SIZE)} >Fresh</a>
          </li>
        </ul>
      </div>
    );
  }
}

class ListItem extends Component {
  render() {
    return (
      <div className="list-content">
        <a href="javascript:void(0);">
          <img className="list-img" alt="" src={this.props.data.display_url} />
          <div className="list-overlay">
            <span className="fb-icons-before like-number">{abbreviateNumber(this.props.data.like_count)}</span>
            <span className="fb-icons-before comment-number">{abbreviateNumber(this.props.data.comment_count)}</span>
          </div>
        </a>
      </div>
    )
  }
}

class ListWrapper extends Component {
  render() {
    const listItems = [];
    this.props.data.forEach((data) => {
      listItems.push(<div key={data.shortcode} className="col-4" onClick={() => this.props.showPopup(data.shortcode)} ><ListItem data={data} /></div>);
    });

    return (
      <div className="list-wrapper">
        <div className="list-row row">
          {listItems}
        </div>
      </div>
    )
  }
}

class PopupMedia extends Component {
  constructor(props) {
    super(props);

    const childrenNumber = (this.props.data.childrens) ? this.props.data.childrens.length : 0;

    this.state = {
      childrenNumber,
      currentChildren: 0,
      video: 'pause',
    };
    this._toggleVideo=this._toggleVideo.bind(this);
    this._changeChildren=this._changeChildren.bind(this);
  }

  _toggleVideo() {
    this.state.video = (this.state.video === 'pause') ? 'playing' : 'pause';
    this.forceUpdate();
  }

  _changeChildren(targetChildren) {
    this.state.video = 'pause';
    this.state.currentChildren = targetChildren;
    this.forceUpdate();
  }

  render() {
    let imgUrl = (this.props.data.childrens) ? this.props.data.childrens[this.state.currentChildren].displayUrl : this.props.data.displayUrl;
    const img = <img className="popup-img" alt="" src={imgUrl} />;

    let video;
    let videoIcon;
    const isVideo = (this.props.data.childrens) ? this.props.data.childrens[this.state.currentChildren].isVideo : this.props.data.isVideo;
    const videoUrl = (this.props.data.childrens) ? this.props.data.childrens[this.state.currentChildren].videoUrl : this.props.data.videoUrl;
    if (isVideo) {
      video = <video controls autoPlay src={videoUrl} type="video/mp4"></video>;
      videoIcon = <a className={`fb-icons3 play ${this.state.video}`} href="javascript:void(0);" onClick={this._toggleVideo}>&nbsp;</a>;
    }
    const media = (this.state.video === 'playing') ? video : img;

    const arrowLeft = (this.state.currentChildren > 0) ? <a className="fb-icons2 arrow arrow-left" href="javascript:void(0);" onClick={() => this._changeChildren(this.state.currentChildren - 1)}>&nbsp;</a> : '';
    const arrowRigth = (this.state.childrenNumber - 1 > this.state.currentChildren) ? <a className="fb-icons2 arrow arrow-right" href="javascript:void(0);" onClick={() => this._changeChildren(this.state.currentChildren + 1)}>&nbsp;</a> : '';

    return (
      <div className="popup-left-wrapper">
        {media}
        {arrowLeft}
        {arrowRigth}
        {videoIcon}
      </div>
    )
  }
}

class PopupContent extends Component {
  render() {
    const caption = handleCaption(this.props.data.caption);

    return (
      <div className="popup-rigth-wrapper">
        <div className="popup-rigth-inner-wrapper">
          <a className="create-time" href={`https://www.instagram.com/p/${this.props.data.shortcode}/`} target="_blank">{timeDiff(this.props.data.takenAtTimestamp)}</a>
          <a className="username" href={`https://www.instagram.com/${this.props.data.owner}/`} target="_blank">{this.props.data.owner}</a>
          <p className="description" dangerouslySetInnerHTML={{__html: caption}}></p>
          <div className="icons-wrapper">
            <span className="fb-icons-before2 like-number">{abbreviateNumber(this.props.data.likeCount)}</span>
            <span className="fb-icons-before2 comment-number">{abbreviateNumber(this.props.data.commentCount)}</span>
          </div>
        </div>
      </div>
    )
  }
}

class PopupWrapper extends Component {
  render() {
    return (
      <div className="popup-outer-wrapper">
        <div className="popup-background" onClick={() => this.props.closePopup()} ></div>
        <div className="popup-wrapper">
          <PopupMedia data={this.props.data} />
          <PopupContent data={this.props.data} />
        </div>
      </div>
    )
  }
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      type: 'hot',
      view: 'list',
      feedList: [],
      feedDetail: {},
      page: 0,
      fetching: false,
    };

    this._fetchData('hot', 0, SIZE);

    this._fetchData=this._fetchData.bind(this);
    this._handleScroll=this._handleScroll.bind(this);
  }

  componentDidMount() {
    document.addEventListener('scroll', this._handleScroll);
  }

  _fetchData(type, page, size) {
    if (this.state.fetching) {
      return;
    }

    this.state.fetching = true;
    fetch(`http://localhost:9000/get-${type}`, {
      method: 'POST',
      body: JSON.stringify({
        page,
        size,
      }),
      headers: {"Content-Type": "application/json"},
    }).then(res => res.json())
      .then((returnData) => {
        const newList = (this.state.type === type) ? this.state.feedList.concat(returnData.feeds) : returnData.feeds;
        this.setState({
          type,
          page,
          fetching: false,
          feedList: newList,
        });
      });
  }

  _handleScroll() {
    const windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
    const body = document.body;
    const html = document.documentElement;
    const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    const windowBottom = windowHeight + window.pageYOffset;

    if (docHeight - windowBottom < 100) {
      if (!this.state.fetching) {
        this._fetchData(this.state.type, this.state.page + 1, SIZE);
      }
    }
  }

  _showPopup = (shortcode) => {
    fetch('http://localhost:9000/get-detail', {
      method: 'POST',
      body: JSON.stringify({
        code: shortcode,
      }),
      headers: {"Content-Type": "application/json"},
    }).then(res => res.json())
      .then((returnData) => {
        this.setState({
          view: 'popup',
          feedDetail: returnData,
        });
      });
  }

  _closePopup = () => {
    this.setState({
      view: 'list',
    });
  }

  render() {
    const popupWrapper = (this.state.view !== 'list') ? <PopupWrapper data={this.state.feedDetail} closePopup={this._closePopup} /> : '';

    return (
      <div>
        <div className="container main-wrapper">
          <TabBar fetchData={this._fetchData} />
          <ListWrapper showPopup={this._showPopup} data={this.state.feedList} />
        </div>
        {popupWrapper}
      </div>
    );
  }
}

export default App;
