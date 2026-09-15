def has_mood(mood):
    return bool(mood.strip())

assert has_mood('calm')
assert not has_mood('')
