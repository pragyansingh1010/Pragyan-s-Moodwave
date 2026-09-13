VALID_MOODS = {'happy', 'calm', 'sad', 'energetic'}

def valid_mood(value):
    return isinstance(value, str) and value.lower() in VALID_MOODS

assert valid_mood('happy')
assert valid_mood('CALM')
assert not valid_mood('unknown')
assert not valid_mood('')
print('Mood rules passed')
