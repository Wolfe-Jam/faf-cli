class FafCli < Formula
  desc "🏎️ FAF - Fast AF AI Context • Project DNA for ANY AI"
  homepage "https://faf.one"
  url "https://registry.npmjs.org/faf-cli/-/faf-cli-3.0.3.tgz"
  sha256 "c8d3eae160a892e32837db3dcae515e843e5383fef52b8141940c8bcf8b6d59f"
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
