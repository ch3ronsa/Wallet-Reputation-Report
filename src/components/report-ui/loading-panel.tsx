type LoadingPanelProps = {
  title: string;
  body: string;
};

export function LoadingPanel(props: LoadingPanelProps) {
  return (
    <section className="panel loading-panel">
      <div className="loading-pulse" />
      <h2>{props.title}</h2>
      <p>{props.body}</p>
    </section>
  );
}
