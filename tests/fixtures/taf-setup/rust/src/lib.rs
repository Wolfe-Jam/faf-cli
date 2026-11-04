//! faf taf setup fixture: 2 passing, 1 failing, 1 skipped (#[ignore]).

pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::add;

    #[test]
    fn adds() {
        assert_eq!(add(1, 2), 3);
    }

    #[test]
    fn adds_negatives() {
        assert_eq!(add(-1, -2), -3);
    }

    #[test]
    fn fails_on_purpose() {
        assert_eq!(add(1, 1), 3, "this fixture fails on purpose");
    }

    #[test]
    #[ignore]
    fn skipped() {}
}
