class FafCli < Formula
  desc "🏎️ FAF - Fast AF AI Context • Project DNA for ANY AI"
  homepage "https://faf.one"
  url "https://registry.npmjs.org/faf-cli/-/faf-cli-3.0.3.tgz"
  sha256 "7ce4af22a414ec44e06c38c22654abd79de3dcf675a3f25c272b5580ab95354f"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    system "#{bin}/faf", "--version"
  end
end
