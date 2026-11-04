using Xunit;

namespace Sample.Tests;

// faf taf setup fixture: 2 passing, 1 failing, 1 skipped.
public class SampleTests
{
    [Fact]
    public void Adds() => Assert.Equal(3, 1 + 2);

    [Fact]
    public void Multiplies() => Assert.Equal(6, 2 * 3);

    [Fact]
    public void FailsOnPurpose() => Assert.Equal(3, 1 + 1);

    [Fact(Skip = "skipped on purpose")]
    public void Skipped() { }
}
