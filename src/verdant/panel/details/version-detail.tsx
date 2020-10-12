import * as React from "react";
import { Nodey } from "../../../lilgit/nodey/";
import { History } from "../../../lilgit/history/";
import { VersionSampler } from "../../sampler/version-sampler";
import { SAMPLE_TYPE, DIFF_TYPE } from "../../../lilgit/sampler";
import VersionHeader from "./version-header";
import { verdantState, selectArtifactDetail } from "../../redux/";
import { connect } from "react-redux";

export type Version_Props = {
  history: History;
  nodey: Nodey;
  no_header: boolean;
  selectArtifact: () => void;
  selected: boolean;
};

class VersionDetail extends React.Component<Version_Props, { sample: string }> {
  myRef: React.RefObject<HTMLDivElement>;

  constructor(props: Version_Props) {
    super(props);
    this.state = {
      sample: "",
    };
  }

  componentDidMount() {
    this.getSample();
    if (this.props.selected) {
      setTimeout(() => {
        if (this.myRef.current)
          this.myRef.current.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
      }, 1000);
    }
  }

  componentDidUpdate(prevProps: Version_Props) {
    if (this.props.nodey.name != prevProps.nodey.name) this.getSample();
  }

  render() {
    this.myRef = React.createRef<HTMLDivElement>();
    return (
      <div
        ref={this.myRef}
        className="v-VerdantPanel-details-version"
        onClick={() => this.props.selectArtifact()}
      >
        {this.showHeader()}
        <div
          className="v-VerdantPanel-details-version-sample"
          dangerouslySetInnerHTML={{ __html: this.state.sample }}
        ></div>
      </div>
    );
  }

  showHeader() {
    if (!this.props.no_header)
      return <VersionHeader nodey={this.props.nodey} />;
    return null;
  }

  async getSample() {
    await this.props.history.ready;
    let prior = this.props.history.store.getPriorVersion(this.props.nodey);
    let s: HTMLDivElement;
    if (prior != null) {
      s = await VersionSampler.sample(
        SAMPLE_TYPE.DIFF,
        this.props.history,
        this.props.nodey,
        null,
        DIFF_TYPE.CHANGE_DIFF,
        prior.name
      );
    } else {
      s = await VersionSampler.sample(
        SAMPLE_TYPE.ARTIFACT,
        this.props.history,
        this.props.nodey
      );
    }
    this.setState({ sample: s.outerHTML });
  }
}

const mapDispatchToProps = (
  dispatch: any,
  ownProps: Partial<Version_Props>
) => {
  return {
    selectArtifact: () => dispatch(selectArtifactDetail(ownProps.nodey.name)),
  };
};

const mapStateToProps = (
  state: verdantState,
  ownProps: Partial<Version_Props>
) => {
  return {
    history: state.getHistory(),
    no_header: ownProps.no_header,
    selected: state.artifactView.selectedArtifactDetail === ownProps.nodey.name,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(VersionDetail);
