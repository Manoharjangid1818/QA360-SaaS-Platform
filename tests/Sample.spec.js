import { test, expect } from '@playwright/test';

test("My first test", async function({page}){
    expect(12).toBe(12)
})
test("My second test", async function({page}){
    expect(100).toBe(100)
})
test.skip("My third test", async function({page}){
    expect(2.0).toBe(2.0)
})

test.only("My fourth test", async function({page}){
    expect("Manohar jangid").toContain("Manohar")
})

test.only("My fifth test", async function({page}){
    expect("Manohar Jangid".includes("Jangid")).toBeTruthy()
})