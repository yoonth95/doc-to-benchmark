interface HomeHeaderProps {
  title: string;
  highlight: string;
  description: string;
}

const HomeHeader = ({ title, highlight, description }: HomeHeaderProps) => (
  <div className="space-y-4">
    <h2 className="text-5xl font-bold leading-tight tracking-tight">
      {title}
      <br />
      <span className="bg-gradient-to-r from-primary via-secondary to-primary-glow bg-clip-text text-transparent">
        {highlight}
      </span>
    </h2>
    <p className="mx-auto max-w-2xl text-xl text-muted-foreground">{description}</p>
  </div>
);

export default HomeHeader;
