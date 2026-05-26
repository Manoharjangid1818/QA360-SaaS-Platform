import { test, expect } from '@playwright/test';

/**
 * Test Suite: Sample Unit Tests
 * Tags: @sanity, @critical
 * 
 * Basic unit tests for assertion validation
 */

test("@sanity - My first test", async function({page}){
    expect(12).toBe(12)
})

test("@sanity - My second test", async function({page}){
    expect(100).toBe(100)
})

test.skip("@sanity - My third test (skipped)", async function({page}){
    expect(2.0).toBe(2.0)
})

test("@critical - My fourth test", async function({page}){
    expect("Manohar jangid").toContain("Manohar")
})

test("@critical - My fifth test", async function({page}){
    expect("Manohar Jangid".includes("Jangid")).toBeTruthy()
})