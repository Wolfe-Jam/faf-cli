package sample;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

// faf taf setup fixture: 2 passing, 1 failing, 1 skipped, over two classes.
class SampleTest {
    @Test
    void adds() {
        assertEquals(3, 1 + 2);
    }

    @Test
    void failsOnPurpose() {
        assertEquals(3, 1 + 1, "this fixture fails on purpose");
    }
}
