class FafCli < Formula
  desc "🏎️ FAF - Fast AF AI Context • Project DNA for ANY AI"
  homepage "https://faf.one"
  url "https://registry.npmjs.org/faf-cli/-/faf-cli-3.0.3.tgz"
  sha256 "1f8b7e0fb4ab948d552f2ff9488e2fcb1e4a7fc5a22e57ad2d3725ba4932d3cd"
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
