fn main(portfolio_value: Field, threshold: pub Field) {
    assert(!portfolio_value.lt(threshold), "Value below threshold");
}
