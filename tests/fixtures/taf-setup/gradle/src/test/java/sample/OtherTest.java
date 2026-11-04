package sample;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class OtherTest {
    @Test
    void multiplies() {
        assertEquals(6, 2 * 3);
    }

    @Test
    @Disabled("skipped on purpose")
    void skipped() {
    }
}
